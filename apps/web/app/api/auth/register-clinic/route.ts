import { NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { clinicName, email, password, countryCode, timezone } = await req.json();

  if (!clinicName || !email || !password) {
    return Response.json({ error: 'clinicName, email, and password are required' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const slug =
    clinicName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    Math.random().toString(36).slice(2, 6);

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .insert({
      name: clinicName,
      slug,
      country_code: countryCode || 'US',
      timezone: timezone || 'UTC',
    })
    .select()
    .single();

  if (clinicError) {
    return Response.json({ error: clinicError.message }, { status: 500 });
  }

  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError || !userData.user) {
    await supabase.from('clinics').delete().eq('id', clinic.id);
    return Response.json({ error: userError?.message || 'Failed to create user' }, { status: 500 });
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userData.user.id,
    clinic_id: clinic.id,
    role: 'clinic_admin',
    full_name: clinicName,
  });

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  return Response.json({ success: true, clinicId: clinic.id });
    }
