'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  TrainFront,
  Radio,
  Building2,
  LineChart,
  Settings,
} from 'lucide-react';
import { cn } from '@/core/utils';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Departures', href: '/departures', icon: TrainFront },
  { label: 'Stations', href: '/stations', icon: Building2 },
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Charts', href: '/charts', icon: LineChart },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white/80 p-6 lg:flex dark:border-slate-900 dark:bg-slate-950/80">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-blue-600 dark:bg-blue-600/20 dark:text-blue-300">
          <Radio className="h-5 w-5" />
        </div>
        MetroFlow
      </div>

      <nav className="mt-10 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-blue-600/15 text-blue-700 dark:text-blue-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-400">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Realtime status</p>
          <p className="mt-2">Streaming data across Berlin metro lines.</p>
          <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            Operational
          </div>
        </div>
        <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <Settings className="h-4 w-4" />
          Settings
        </button>
      </div>
    </aside>
  );
}
