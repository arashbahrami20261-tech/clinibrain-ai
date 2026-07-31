import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const clinicId = searchParams.get('clinicId');
  const serviceId = searchParams.get('serviceId');
  const doctorId = searchParams.get('doctorId');
  const date = searchParams.get('date'); // YYYY-MM-DD

  if (!clinicId || !date) {
    return Response.json({ error: 'clinicId and date are required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  let doctorIds: string[] = [];
  if (doctorId) {
    doctorIds = [doctorId];
  } else {
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);
    doctorIds = (doctors || []).map((d) => d.id);
  }

  let durationMinutes = 30;
  if (serviceId) {
    const { data: service } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .single();
    if (service) durationMinutes = service.duration_minutes;
  }

  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const allSlots: { doctorId: string; startTime: string; endTime: string }[] = [];

  for (const docId of doctorIds) {
    const { data: override } = await supabase
      .from('doctor_availability_overrides')
      .select('*')
      .eq('doctor_id', docId)
      .eq('date', date)
      .maybeSingle();

    if (override && !override.is_available) continue;

    const windows = override && override.is_available
      ? [{ start_time: override.start_time, end_time: override.end_time }]
      : (
          await supabase
            .from('doctor_availability')
            .select('start_time, end_time')
            .eq('doctor_id', docId)
            .eq('day_of_week', dayOfWeek)
        ).data || [];

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('doctor_id', docId)
      .gte('start_time', `${date}T00:00:00Z`)
      .lt('start_time', `${date}T23:59:59Z`)
      .not('status', 'in', '("cancelled","no_show")');

    for (const window of windows) {
      let cursor = new Date(`${date}T${window.start_time}Z`);
      const windowEnd = new Date(`${date}T${window.end_time}Z`);

      while (cursor.getTime() + durationMinutes * 60000 <= windowEnd.getTime()) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor.getTime() + durationMinutes * 60000);

        const overlaps = (existingAppointments || []).some((appt) => {
          const apptStart = new Date(appt.start_time);
          const apptEnd = new Date(appt.end_time);
          return slotStart < apptEnd && slotEnd > apptStart;
        });

        if (!overlaps) {
          allSlots.push({
            doctorId: docId,
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
          });
        }
        cursor = new Date(cursor.getTime() + durationMinutes * 60000);
      }
    }
  }

  return Response.json({ slots: allSlots });
                         }
