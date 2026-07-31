import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { buildTriageSystemPrompt } from '@/lib/ai/systemPrompts';
import { createServiceClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const { clinicId, message, history = [], language = 'en' } = await req.json();

  if (!clinicId || !message) {
    return Response.json({ error: 'clinicId and message are required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: clinic } = await supabase.from('clinics').select('name').eq('id', clinicId).single();
  if (!clinic) return Response.json({ error: 'Clinic not found' }, { status: 404 });

  const systemPrompt = buildTriageSystemPrompt({ clinicName: clinic.name, language });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages: [...history, { role: 'user', content: message }],
  });

  const text = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');

  const urgency = /emergency/i.test(text) ? 'emergency' : /same[ -]?day/i.test(text) ? 'same_day' : 'routine';

  return Response.json({ reply: text, urgency });
      }
