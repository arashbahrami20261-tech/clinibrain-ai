'use server';

import { createSessionClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addService(formData: FormData) {
  const supabase = createSessionClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', session!.user.id).single();

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const durationMinutes = Number(formData.get('duration_minutes'));
  const basePriceUsd = Number(formData.get('base_price_usd'));

  const { error } = await supabase.from('services').insert({
    clinic_id: profile!.clinic_id,
    name,
    description,
    duration_minutes: durationMinutes,
    base_price_usd: basePriceUsd,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/services');
}

export async function deleteService(serviceId: string) {
  const supabase = createSessionClient();
  const { error } = await supabase.from('services').delete().eq('id', serviceId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/services');
}

export async function toggleServiceActive(serviceId: string, isActive: boolean) {
  const supabase = createSessionClient();
  const { error } = await supabase.from('services').update({ is_active: isActive }).eq('id', serviceId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/services');
                                              }
