import { createSessionClient } from '@/lib/supabase/server';

export default async function DashboardOverview() {
  const supabase = createSessionClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', session!.user.id).single();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todaysAppointments } = await supabase
    .from('appointments')
    .select('id, patient_name, start_time, status, services(name)')
    .eq('clinic_id', profile!.clinic_id)
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())
    .order('start_time', { ascending: true });

  const { count: pendingCount } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', profile!.clinic_id)
    .eq('status', 'pending');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Today&apos;s appointments</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{todaysAppointments?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Pending confirmations</p>
          <p className="text-3xl font-semibold text-amber-600 mt-1">{pendingCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Widget status</p>
          <p className="text-3xl font-semibold text-teal-600 mt-1">Active</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-medium text-slate-900">Today&apos;s schedule</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {(todaysAppointments || []).length === 0 && (
            <p className="px-5 py-6 text-sm text-slate-500">No appointments scheduled today.</p>
          )}
          {(todaysAppointments || []).map((appt: any) => (
            <div key={appt.id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{appt.patient_name}</p>
                <p className="text-sm text-slate-500">{appt.services?.name || 'General visit'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-700">
                  {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    appt.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : appt.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {appt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
