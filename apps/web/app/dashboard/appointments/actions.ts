'use server';

import { createSessionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  const supabase = createSessionClient();
  const { error } = await supabase.from('appointments').update({ status }).eq('id', appointmentId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
}
