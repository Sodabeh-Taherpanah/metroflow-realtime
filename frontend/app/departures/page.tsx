'use client';

import React, { useEffect, useState } from 'react';
import socket from '../../utils/websocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RealtimeIndicator from '@/components/RealtimeIndicator';

interface Departure {
  tripId: string;
  stop: {
    id: string;
    name: string;
  };
  when: string;
  plannedWhen: string;
  direction: string;
  platform?: string;
  delay?: number;
  remarks?: Array<{ type?: string; summary?: string; text?: string }>;
  line: {
    name: string;
    product?: string;
  };
}

const getTransferHints = (lineName: string): string[] => {
  const normalized = lineName.toLowerCase();
  if (normalized.startsWith('u')) {
    return ['S-Bahn transfer in 4-6 min', 'Bus M32 nearby'];
  }
  if (normalized.startsWith('s')) {
    return ['U-Bahn transfer in 3-5 min', 'Regional train connection'];
  }
  if (normalized.startsWith('re') || normalized.startsWith('rb')) {
    return ['S-Bahn city connector', 'Airport bus transfer'];
  }
  return ['U-Bahn and Bus transfer options nearby'];
};

const getReliabilityStatus = (delayMinutes: number) => {
  if (delayMinutes <= 1) return { label: 'On time', variant: 'success' as const };
  if (delayMinutes <= 5) return { label: 'At risk', variant: 'warning' as const };
  return { label: 'Delayed', variant: 'destructive' as const };
};

const RealTimeDepartures = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [stationId] = useState('900029305'); // Default station
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    socket.connect();

    // Subscribe to departures for the station
    socket.emit('subscribe:departures', { stationId });

    socket.on('departures:update', (data: { stationId: string; departures: Departure[] }) => {
      setDepartures(Array.isArray(data.departures) ? data.departures : []);
    });

    return () => {
      socket.emit('unsubscribe:departures', { stationId });
      socket.off('departures:update');
      socket.disconnect();
    };
  }, [stationId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Departures
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Real-time departures
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Station: Berlin, Staaken Bhf</p>
        </div>
        <RealtimeIndicator label="Live feed" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next departures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {departures.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading departures...</p>
          ) : (
            departures.map((departure: Departure, index: number) => {
              const lineName = departure.line?.name ?? 'Unknown Line';
              const direction = departure.direction ?? 'Unknown Direction';
              const whenValue = departure.when ?? departure.plannedWhen;
              const plannedValue = departure.plannedWhen;
              const whenLabel = whenValue
                ? new Date(whenValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Unknown Time';
              const minutesAway = whenValue
                ? Math.max(0, Math.round((new Date(whenValue).getTime() - currentTime) / 60000))
                : null;
              const delayMinutes = departure.delay
                ? Math.max(0, Math.round(departure.delay / 60))
                : whenValue && plannedValue
                  ? Math.max(
                      0,
                      Math.round(
                        (new Date(whenValue).getTime() - new Date(plannedValue).getTime()) / 60000
                      )
                    )
                  : 0;
              const reliability = getReliabilityStatus(delayMinutes);
              const transferHints = getTransferHints(lineName);
              const disruptionNote =
                departure.remarks?.[0]?.summary || departure.remarks?.[0]?.text;

              return (
                <div
                  key={departure.tripId ?? whenValue ?? index}
                  className="space-y-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800/60 dark:bg-slate-950/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {lineName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{direction}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Platform: {departure.platform || 'TBA'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{whenLabel}</Badge>
                      <Badge variant="success">
                        {minutesAway !== null ? `${minutesAway} min` : 'Scheduled'}
                      </Badge>
                      <Badge variant={reliability.variant}>{reliability.label}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                      Delay: {delayMinutes} min
                    </span>
                    {transferHints.map(hint => (
                      <span
                        key={`${departure.tripId}-${hint}`}
                        className="rounded-full bg-blue-100/70 px-2 py-1 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                      >
                        {hint}
                      </span>
                    ))}
                    {disruptionNote ? (
                      <span className="rounded-full bg-amber-100/70 px-2 py-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        {disruptionNote}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeDepartures;
