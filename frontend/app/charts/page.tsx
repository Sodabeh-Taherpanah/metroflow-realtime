'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/utils/api';

type HourlyBucket = { hour: string; count: number };
type Summary = { agentCount: number; hourlyActivity: HourlyBucket[] };

const fetchSummary = async (): Promise<Summary> => {
  const { data } = await apiClient.get<Summary>('/tracking/summary');
  return data;
};

const formatHour = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const WINDOW_MULTIPLIERS = {
  '24h': 1,
  '7d': 4,
  '30d': 10,
} as const;

type WindowRange = keyof typeof WINDOW_MULTIPLIERS;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

const ChartsView = () => {
  const [windowRange, setWindowRange] = React.useState<WindowRange>('24h');

  const { data, isLoading, error } = useQuery({
    queryKey: ['tracking-summary'],
    queryFn: fetchSummary,
    refetchInterval: 30_000,
  });

  const multiplier = WINDOW_MULTIPLIERS[windowRange];
  const chartData = (data?.hourlyActivity ?? []).map(b => ({
    hour: formatHour(b.hour),
    traces: b.count,
  }));

  const events24h = (data?.hourlyActivity ?? []).reduce((sum, bucket) => sum + bucket.count, 0);
  const estimatedDelayedTrips = Math.max(1, Math.round(events24h * 0.08 * multiplier));
  const estimatedPassengersAffected = estimatedDelayedTrips * 52;
  const estimatedDelayMinutesAvoided = Math.round(estimatedDelayedTrips * 4.3);
  const estimatedCostAvoided = estimatedDelayMinutesAvoided * 11;
  const serviceCoverage = {
    zoneA: Math.min(99, Math.max(78, 84 + Math.round((data?.agentCount ?? 0) * 0.4))),
    zoneB: Math.min(96, Math.max(71, 79 + Math.round(events24h * 0.01))),
    zoneC: Math.min(92, Math.max(65, 72 + Math.round(events24h * 0.008))),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Analytics
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Performance charts
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Product-facing KPIs and operations analytics from the tracking pipeline.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(['24h', '7d', '30d'] as WindowRange[]).map(range => (
          <button
            key={range}
            onClick={() => setWindowRange(range)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              windowRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
            }`}
            type="button"
          >
            {range}
          </button>
        ))}
        <Badge variant="outline" className="ml-1">
          Demo estimates based on live event intensity
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Active agents
            </p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
              {isLoading ? '—' : (data?.agentCount ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Events ({windowRange})
            </p>
            <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">
              {isLoading ? '—' : Math.round(events24h * multiplier)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Data source
            </p>
            <p className="mt-1 text-sm font-medium">
              {error ? (
                <span className="text-rose-400">Backend unreachable</span>
              ) : (
                <span className="text-emerald-400">Live — refreshes every 30 s</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Delay impact
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {isLoading ? '—' : estimatedDelayedTrips}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Estimated delayed trips</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Passengers affected
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {isLoading ? '—' : estimatedPassengersAffected.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Estimated customer impact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Delay minutes avoided
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {isLoading ? '—' : estimatedDelayMinutesAvoided.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              By faster response playbooks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Estimated cost avoided
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {isLoading ? '—' : formatCurrency(estimatedCostAvoided)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Operational impact signal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Service Coverage by Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Zone A</span>
              <Badge variant="success">{serviceCoverage.zoneA}%</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Zone B</span>
              <Badge variant="warning">{serviceCoverage.zoneB}%</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Zone C</span>
              <Badge variant="outline">{serviceCoverage.zoneC}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly report preview cards</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800/60">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                Operations report
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                Incident MTTR down 14%
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">April 2026 preview</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800/60">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                SLA report
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                98.7% service availability
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No critical breach</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800/60">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                Customer impact
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                11,240 riders protected
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Estimated this month
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent location events — last 24 hours</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Loading chart data…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-rose-400">
              Could not load data. Is the backend running?
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              No events yet. Start the simulator on the{' '}
              <a href="/tracking" className="ml-1 text-blue-500 underline">
                Tracking
              </a>{' '}
              page to generate data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="traces" name="Location events" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartsView;
