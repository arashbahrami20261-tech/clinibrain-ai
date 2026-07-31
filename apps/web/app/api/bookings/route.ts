import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    clinicId,
    doctor_id: doctorId,
    service_id: serviceId,
    patient_name: patientName,
    patient_email: patientEmail,
    patient_phone: patientPhone,
    start_time: startTime,
    source = 'widget',
  } = body;

  if (!clinicId || !doctorId || !patientName || !startTime) {
    return Response.json(
      { success: false, error: 'clinicId, doctor_id, patient_name, and start_time are required' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { data: doctor } = await supabase
    .from('doctors')
    .select('id, clinic_id')
    .eq('id', doctorId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (!doctor) {
    return Response.json({ success: false, error: 'Invalid doctor for this clinic' }, { status: 403 });
  }

  let durationMinutes = 30;
  if (serviceId) {
    const { data: service } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', serviceId)
      .eq('clinic_id', clinicId)
      .maybeSingle();
    if (!service) {
      return Response.json({ success: false, error: 'Invalid service for this clinic' }, { status: 403 });
    }
    durationMinutes = service.duration_minutes;
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: clinicId,
      doctor_id: doctorId,
      service_id: serviceId || null,
      patient_name: patientName,
      patient_email: patientEmail || null,
      patient_phone: patientPhone || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: 'pending',
      source,
    })
    .select()
    .single();

  if (error) {
    const isConflict = error.message.includes('no_overlapping_appointments');
    return Response.json(
      { success: false, error: isConflict ? 'That time slot was just booked by someone else' : error.message },
      { status: isConflict ? 409 : 500 }
    );
  }

  return Response.json({ success: true, appointment: data });
       }
