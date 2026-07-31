'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/appointments', label: 'Appointments' },
  { href: '/dashboard/schedule', label: 'Schedule' },
  { href: '/dashboard/services', label: 'Services' },
  { href: '/dashboard/settings/embed-code', label: 'Embed Widget' },
];

export default function Sidebar({
  clinicName,
  role,
  userName,
}: {
  clinicName?: string;
  role?: string;
  userName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
      <div className="mb-8">
        <h2 className="font-semibold text-slate-900">{clinicName || 'CliniBrain AI'}</h2>
        <p className="text-xs text-slate-500">
          {userName} · {role}
        </p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-3 py-2 text-sm font-medium ${
              pathname === item.href ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button onClick={handleSignOut} className="text-sm text-slate-500 hover:text-slate-700 mt-4 text-left">
        Sign out
      </button>
    </aside>
  );
}
