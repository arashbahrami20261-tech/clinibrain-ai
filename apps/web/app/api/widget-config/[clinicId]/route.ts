import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { clinicId: string } }) {
  const supabase = createServiceClient();

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, logo_url, widget_theme, default_currency, is_active')
    .eq('id', params.clinicId)
    .maybeSingle();

  if (!clinic || !clinic.is_active) {
    return Response.json({ error: 'Clinic not found or inactive' }, { status: 404 });
  }

  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, base_price_usd')
    .eq('clinic_id', params.clinicId)
    .eq('is_active', true);

  return Response.json({
    clinicId: clinic.id,
    name: clinic.name,
    logoUrl: clinic.logo_url,
    theme: clinic.widget_theme,
    currency: clinic.default_currency,
    services,
  });
    }
