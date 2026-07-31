'use client';

import { useTransition } from 'react';
import { deleteService, toggleServiceActive } from '@/app/dashboard/services/actions';

export default function ServiceRow({ service }: { service: any }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-slate-900">{service.name}</p>
        <p className="text-sm text-slate-500">
          {service.duration_minutes} min · ${service.base_price_usd}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled={isPending}
          onClick={() => startTransition(() => toggleServiceActive(service.id, !service.is_active))}
          className={`text-xs px-2 py-1 rounded-full ${
            service.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {service.is_active ? 'Active' : 'Inactive'}
        </button>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => deleteService(service.id))}
          className="text-xs font-medium text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
