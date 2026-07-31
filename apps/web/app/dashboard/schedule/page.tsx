import { createSessionClient } from '@/lib/supabase/server';
import ScheduleGrid from '@/components/dashboard/ScheduleGrid';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function SchedulePage() {
  const supabase = createSessionClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id, role')
    .eq('id', session!.user.id)
    .single();

  const { data: doctors } = await supabase
    .from('doctors')
    .select('id, specialty, profiles(full_name)')
    .eq('clinic_id', profile!.clinic_id)
    .eq('is_active', true);

  const { data: availability } = await supabase
    .from('doctor_availability')
    .select('*')
    .in('doctor_id', (doctors || []).map((d: any) => d.id));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Doctor schedules</h1>
      <div className="space-y-8">
        {(doctors || []).map((doctor: any) => (
          <div key={doctor.id} className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-medium text-slate-900 mb-4">
              {doctor.profiles?.full_name || 'Unnamed doctor'} {doctor.specialty ? `· ${doctor.specialty}` : ''}
            </h2>
            <ScheduleGrid
              doctorId={doctor.id}
              days={DAYS}
              existing={(availability || []).filter((a: any) => a.doctor_id === doctor.id)}
            />
          </div>
        ))}
        {(doctors || []).length === 0 && (
          <p className="text-sm text-slate-500">No doctors added yet. Add doctors from the Team page first.</p>
        )}
      </div>
    </div>
  );
        }
