import Link from 'next/link';
import { Activity, CalendarClock, MapPin, TrainFront } from 'lucide-react';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-linear-to-br from-white via-slate-50 to-slate-100 p-8 dark:border-slate-800/70 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600 dark:text-blue-300">
            MetroFlow Command
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white lg:text-4xl">
            Real-time transport intelligence for Berlin
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Monitor live departures, provider uptime, and station activity in one unified dashboard.
            Stay ahead of disruptions with instant alerts and live routing.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-500">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            <Link href="/departures">View departures</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live lines"
          value="128"
          icon={<TrainFront className="h-5 w-5" />}
          trend="+6% vs last hour"
        />
        <StatCard
          label="Active stations"
          value="412"
          icon={<MapPin className="h-5 w-5" />}
          trend="+14 updates/min"
        />
        <StatCard
          label="Realtime events"
          value="2.4k"
          icon={<Activity className="h-5 w-5" />}
          trend="Streaming"
        />
        <StatCard
          label="Next advisory"
          value="07:45"
          icon={<CalendarClock className="h-5 w-5" />}
          trend="Scheduled briefing"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>System overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <p>
              MetroFlow ingests provider telemetry, schedules, and rider flow metrics to deliver a
              unified operational view. Use the navigation to access live departures, interactive
              maps, and analytics snapshots.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Alerts
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  2 advisory notices
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Power outage near Ostbahnhof.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  Capacity
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  74% occupancy
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Peak expected at 18:10.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              asChild
              className="w-full bg-slate-900 text-slate-100 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Link href="/stations">Browse stations</Link>
            </Button>
            <Button
              asChild
              className="w-full bg-slate-900 text-slate-100 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Link href="/map">Open live map</Link>
            </Button>
            <Button
              asChild
              className="w-full bg-slate-900 text-slate-100 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Link href="/charts">View analytics</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
