'use client';

import { useTransition } from 'react';
import { updateAppointmentStatus } from '@/app/dashboard/appointments/actions';

export default function AppointmentRow({ appointment }: { appointment: any }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: string) {
    startTransition(() => {
      updateAppointmentStatus(appointment.id, status);
    });
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-5 py-3">
        <p className="font-medium text-slate-900">{appointment.patient_name}</p>
        <p className="text-xs text-slate-500">{appointment.patient_email || appointment.patient_phone}</p>
      </td>
      <td className="px-5 py-3 text-slate-600">{appointment.services?.name || '—'}</td>
      <td className="px-5 py-3 text-slate-600">
        {new Date(appointment.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
      </td>
      <td className="px-5 py-3 text-slate-500 capitalize">{appointment.source}</td>
      <td className="px-5 py-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full capitalize ${
            appointment.status === 'confirmed'
              ? 'bg-green-100 text-green-700'
              : appointment.status === 'pending'
              ? 'bg-amber-100 text-amber-700'
              : appointment.status === 'cancelled'
              ? 'bg-red-100 text-red-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {appointment.status}
        </span>
      </td>
      <td className="px-5 py-3 space-x-2">
        {appointment.status === 'pending' && (
          <button
            disabled={isPending}
            onClick={() => handleStatusChange('confirmed')}
            className="text-xs font-medium text-teal-600 hover:underline"
          >
            Confirm
          </button>
        )}
        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <button
            disabled={isPending}
            onClick={() => handleStatusChange('cancelled')}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Cancel
          </button>
        )}
      </td>
    </tr>
  );
          }
