import { redirect } from 'next/navigation';
import { createSessionClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSessionClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, clinic_id, clinics(name)')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar clinicName={(profile as any).clinics?.name} role={profile.role} userName={profile.full_name} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
    }
