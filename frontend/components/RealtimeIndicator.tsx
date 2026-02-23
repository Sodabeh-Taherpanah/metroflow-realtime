'use client';

import React from 'react';
import { cn } from '@/core/utils';

type RealtimeIndicatorProps = {
  label?: string;
  status?: 'online' | 'offline' | 'degraded';
  className?: string;
};

const statusStyles: Record<NonNullable<RealtimeIndicatorProps['status']>, string> = {
  online: 'bg-emerald-400 shadow-emerald-400/50',
  degraded: 'bg-amber-400 shadow-amber-400/50',
  offline: 'bg-rose-500 shadow-rose-500/50',
};

export default function RealtimeIndicator({
  label = 'Live updates',
  status = 'online',
  className,
}: RealtimeIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300',
        className
      )}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
            statusStyles[status]
          )}
        />
        <span
          className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', statusStyles[status])}
        />
      </span>
      <span className="font-medium uppercase tracking-[0.2em]">{label}</span>
    </div>
  );
}
