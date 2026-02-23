import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/core/utils';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  className?: string;
};

export default function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        'border border-slate-200 bg-white dark:border-slate-800/60 dark:bg-slate-950/50',
        className
      )}
    >
      <CardContent className="flex items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
          {trend ? (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-300">{trend}</p>
          ) : null}
        </div>
        <div className="rounded-full bg-slate-100 p-3 text-slate-700 shadow-inner dark:bg-slate-900 dark:text-slate-200">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
