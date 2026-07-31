import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceClient } from '@/lib/supabase/server';
import { buildChatSystemPrompt } from '@/lib/ai/systemPrompts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const bookingTools = [
  {
    name: 'check_availability',
    description: 'Get available appointment slots for a service on a given date.',
    input_schema: {
      type: 'object',
      properties: {
        service_id: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['date'],
    },
  },
  {
    name: 'create_appointment',
    description:
      'Book a confirmed appointment once the patient has provided their name, contact info, chosen service, doctor, and a specific time slot.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string' },
        patient_email: { type: 'string' },
        patient_phone: { type: 'string' },
        service_id: { type: 'string' },
        doctor_id: { type: 'string' },
        start_time: { type: 'string', description: 'ISO 8601 datetime' },
      },
      required: ['patient_name', 'service_id', 'doctor_id', 'start_time'],
    },
  },
];

export async function POST(req: NextRequest) {
  const { clinicId, conversationId, message, language = 'en' } = await req.json();

  if (!clinicId || !message) {
    return Response.json({ error: 'clinicId and message are required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: clinic } = await supabase.from('clinics').select('name').eq('id', clinicId).single();
  if (!clinic) {
    return Response.json({ error: 'Clinic not found' }, { status: 404 });
  }

  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes')
    .eq('clinic_id', clinicId)
    .eq('is_active', true);

  let convoId = conversationId;
  if (!convoId) {
    const { data: newConvo, error } = await supabase
      .from('chat_conversations')
      .insert({ clinic_id: clinicId, language })
      .select('id')
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    convoId = newConvo.id;
  }

  await supabase.from('chat_messages').insert({
    conversation_id: convoId,
    role: 'user',
    content: message,
  });

  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('conversation_id', convoId)
    .order('created_at', { ascending: true })
    .limit(30);

  const systemPrompt = buildChatSystemPrompt({
    clinicName: clinic.name,
    services: (services || []).map((s) => ({
      name: s.name,
      durationMinutes: s.duration_minutes,
      description: s.description,
    })),
    language,
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    tools: bookingTools as any,
    messages: (history || []).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  });

  const toolUseBlocks = response.content.filter((b: any) => b.type === 'tool_use');
  let finalText = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');

  for (const block of toolUseBlocks as any[]) {
    if (block.name === 'check_availability') {
      const availRes = await fetch(
        `${req.nextUrl.origin}/api/availability?clinicId=${clinicId}&serviceId=${block.input.service_id || ''}&date=${block.input.date}`
      );
      const availData = await availRes.json();
      finalText += `\n\n${JSON.stringify(availData.slots || [])}`;
    }
    if (block.name === 'create_appointment') {
      const bookingRes = await fetch(`${req.nextUrl.origin}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, ...block.input, source: 'widget' }),
      });
      const bookingData = await bookingRes.json();
      finalText += bookingData.success
        ? `\n\nAppointment confirmed for ${block.input.start_time}.`
        : `\n\nSorry, that slot is no longer available: ${bookingData.error}`;
    }
  }

  await supabase.from('chat_messages').insert({
    conversation_id: convoId,
    role: 'assistant',
    content: finalText,
  });

  return Response.json({ conversationId: convoId, reply: finalText });
      }
