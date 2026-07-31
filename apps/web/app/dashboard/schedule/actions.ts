'use server';

import { createSessionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setAvailability(doctorId: string, dayOfWeek: number, startTime: string, endTime: string) {
  const supabase = createSessionClient();

  await supabase.from('doctor_availability').delete().eq('doctor_id', doctorId).eq('day_of_week', dayOfWeek);

  if (startTime && endTime) {
    const { error } = await supabase.from('doctor_availability').insert({
      doctor_id: doctorId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath('/dashboard/schedule');
  }
