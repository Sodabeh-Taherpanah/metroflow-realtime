'use client';

import React from 'react';
import { Search, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers';
import RealtimeIndicator from '@/components/RealtimeIndicator';
import { Button } from '@/components/ui/button';

export default function Topbar() {
  const { isDark, setTheme } = useTheme();
  const [searchText, setSearchText] = React.useState('');

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-6 py-4 backdrop-blur lg:px-10 dark:border-slate-900 dark:bg-slate-950/80">
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="search"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search stations, lines, or alerts"
            aria-label="Search stations, lines, or alerts"
            className="w-75 rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
        <RealtimeIndicator />
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="border border-slate-200 bg-white text-slate-700 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="border border-slate-200 bg-white text-slate-700 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-100"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 md:flex dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          City Ops Team
        </div>
      </div>
    </header>
  );
}
