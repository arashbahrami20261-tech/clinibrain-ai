'use client';

import { useState, useTransition } from 'react';
import { setAvailability } from '@/app/dashboard/schedule/actions';

export default function ScheduleGrid({
  doctorId,
  days,
  existing,
}: {
  doctorId: string;
  days: string[];
  existing: any[];
}) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(
    days.map((_, i) => {
      const found = existing.find((a) => a.day_of_week === i);
      return { start: found?.start_time?.slice(0, 5) || '', end: found?.end_time?.slice(0, 5) || '' };
    })
  );

  function handleSave(dayIndex: number) {
    const { start, end } = values[dayIndex];
    startTransition(() => {
      setAvailability(doctorId, dayIndex, start, end);
    });
  }

  return (
    <div className="space-y-3">
      {days.map((day, i) => (
        <div key={day} className="flex items-center gap-3">
          <span className="w-24 text-sm text-slate-600">{day}</span>
          <input
            type="time"
            value={values[i].start}
            onChange={(e) => {
              const next = [...values];
              next[i] = { ...next[i], start: e.target.value };
              setValues(next);
            }}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
          />
          <span className="text-slate-400">to</span>
          <input
            type="time"
            value={values[i].end}
            onChange={(e) => {
              const next = [...values];
              next[i] = { ...next[i], end: e.target.value };
              setValues(next);
            }}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            disabled={isPending}
            onClick={() => handleSave(i)}
            className="text-xs font-medium text-teal-600 hover:underline ml-2"
          >
            Save
          </button>
        </div>
      ))}
    </div>
  );
        }
