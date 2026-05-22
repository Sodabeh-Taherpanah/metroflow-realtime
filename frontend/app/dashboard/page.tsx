'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Radio, ShieldCheck } from 'lucide-react';
import apiClient from '../../utils/api';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RealtimeIndicator from '@/components/RealtimeIndicator';

type ProviderStatus = {
  id: string;
  name: string;
  isOnline: boolean;
};

const fetchProviderStatus = async (): Promise<ProviderStatus[]> => {
  const { data } = await apiClient.get<{
    checks?: { database?: 'up' | 'down'; redis?: 'up' | 'down' };
  }>('/health');

  const checks = data?.checks ?? {};
  return [
    { id: 'database', name: 'Database', isOnline: checks.database === 'up' },
    { id: 'redis', name: 'Redis', isOnline: checks.redis === 'up' },
  ];
};

const ProviderStatusDashboard = () => {
  const {
    data: statuses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['providerStatus'],
    queryFn: fetchProviderStatus,
  });

  const onlineCount = statuses.filter(status => status.isOnline).length;
  const offlineCount = statuses.length - onlineCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Operations
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Provider status dashboard
          </h1>
        </div>
        <RealtimeIndicator />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Providers online"
          value={onlineCount}
          icon={<Radio className="h-5 w-5" />}
          trend={onlineCount > 0 ? 'Stable connectivity' : 'Awaiting data'}
        />
        <StatCard
          label="Providers offline"
          value={offlineCount}
          icon={<ShieldCheck className="h-5 w-5" />}
          trend={offlineCount === 0 ? 'No incidents' : 'Investigate outages'}
        />
        <StatCard label="Realtime events" value="1.9k" icon={<Activity className="h-5 w-5" />} />
        <StatCard label="Avg latency" value="320ms" icon={<Database className="h-5 w-5" />} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Provider health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading provider statuses...
              </p>
            ) : error ? (
              <p className="text-sm text-rose-300">Error loading provider statuses.</p>
            ) : statuses.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No providers detected yet.
              </p>
            ) : (
              <div className="space-y-2">
                {statuses.map(status => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800/60 dark:bg-slate-950/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {status.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Last check: just now
                      </p>
                    </div>
                    <Badge variant={status.isOnline ? 'success' : 'destructive'}>
                      {status.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Realtime summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Streams
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                14 active channels
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Berlin S-Bahn + U-Bahn
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Alerts
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                3 minor delays
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Monitoring inbound fixes
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default ProviderStatusDashboard;
