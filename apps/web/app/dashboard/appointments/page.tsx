import { createSessionClient } from '@/lib/supabase/server';
import AppointmentRow from '@/components/dashboard/AppointmentRow';

export default async function AppointmentsPage() {
  const supabase = createSessionClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', session!.user.id).single();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, patient_name, patient_email, patient_phone, start_time, status, source, services(name)')
    .eq('clinic_id', profile!.clinic_id)
    .order('start_time', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Appointments</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-5 py-3 font-medium">Patient</th>
              <th className="px-5 py-3 font-medium">Service</th>
              <th className="px-5 py-3 font-medium">Date & time</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(appointments || []).map((appt: any) => (
              <AppointmentRow key={appt.id} appointment={appt} />
            ))}
          </tbody>
        </table>
        {(appointments || []).length === 0 && (
          <p className="px-5 py-6 text-sm text-slate-500">No appointments yet.</p>
        )}
      </div>
    </div>
  );
    }
