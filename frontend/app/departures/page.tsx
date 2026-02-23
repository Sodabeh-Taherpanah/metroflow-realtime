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
  line: {
    name: string;
  };
}

const RealTimeDepartures = () => {
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [stationId] = useState('900029305'); // Default station

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
              const whenLabel = whenValue
                ? new Date(whenValue).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Unknown Time';
              const minutesAway = whenValue
                ? Math.max(0, Math.round((new Date(whenValue).getTime() - Date.now()) / 60000))
                : null;

              return (
                <div
                  key={departure.tripId ?? whenValue ?? index}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800/60 dark:bg-slate-950/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {lineName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{direction}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{whenLabel}</Badge>
                    <Badge variant="success">
                      {minutesAway !== null ? `${minutesAway} min` : 'Scheduled'}
                    </Badge>
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
