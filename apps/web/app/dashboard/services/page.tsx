import { createSessionClient } from '@/lib/supabase/server';
import { addService } from './actions';
import ServiceRow from '@/components/dashboard/ServiceRow';

export default async function ServicesPage() {
  const supabase = createSessionClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data: profile } = await supabase.from('profiles').select('clinic_id').eq('id', session!.user.id).single();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('clinic_id', profile!.clinic_id)
    .order('created_at', { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Services & pricing</h1>

      <div className="bg-white rounded-xl border border-slate-200 mb-8">
        <div className="divide-y divide-slate-100">
          {(services || []).map((service: any) => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </div>
        {(services || []).length === 0 && (
          <p className="px-5 py-6 text-sm text-slate-500">No services yet — add your first one below.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-medium text-slate-900 mb-4">Add a service</h2>
        <form action={addService} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
            <input
              name="duration_minutes"
              type="number"
              required
              defaultValue={30}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Base price (USD)</label>
            <input
              name="base_price_usd"
              type="number"
              step="0.01"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea name="description" className="w-full rounded-lg border border-slate-300 px-3 py-2" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="bg-teal-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-teal-700"
            >
              Add service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
    }
