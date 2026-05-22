'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface Station {
  id: string;
  name: string;
}

const getStationInsight = (station: Station) => {
  const lowered = station.name.toLowerCase();

  if (lowered.includes('hauptbahnhof') || lowered.includes('central')) {
    return {
      profile: 'Major interchange hub',
      peak: 'Peak demand: 07:30-09:00, 16:30-18:30',
      connectivity: 'High rail + regional connectivity',
      note: 'Priority station for disruption management.',
    };
  }

  if (lowered.includes('ost') || lowered.includes('zoo')) {
    return {
      profile: 'Commuter transfer station',
      peak: 'Peak demand: 07:00-08:45, 17:00-19:00',
      connectivity: 'Strong U-Bahn and S-Bahn transfers',
      note: 'Monitor crowding and transfer waiting times.',
    };
  }

  return {
    profile: 'Neighborhood service station',
    peak: 'Peak demand: 07:45-09:15, 16:45-18:15',
    connectivity: 'Bus and metro feeder links available',
    note: 'Stable service, use as fallback transfer node.',
  };
};

type HealthResponse = {
  status: 'ok' | 'degraded';
  checks?: {
    database?: 'up' | 'down';
    redis?: 'up' | 'down';
  };
  timestamp?: string;
};

const fetchStations = async () => {
  const { data } = await apiClient.get('/vbb/stations?query=Berlin&limit=20');
  return data;
};

const fetchProviderHealth = async (): Promise<HealthResponse> => {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
};

const StationsList = () => {
  const {
    data: stations = [],
    isLoading,
    error,
  } = useQuery({ queryKey: ['stations'], queryFn: fetchStations });

  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ['provider-health'],
    queryFn: fetchProviderHealth,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Stations
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Active stations</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Top 20 Berlin stations with realtime feeds.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Station directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading stations...</p>
          ) : error ? (
            <p className="text-sm text-rose-300">Error loading stations.</p>
          ) : (
            stations.map((station: Station) => (
              <div
                key={station.id}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800/60 dark:bg-slate-950/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-300">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {station.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">ID: {station.id}</p>
                    </div>
                  </div>
                  <Badge variant="success">Live</Badge>
                </div>

                {(() => {
                  const insight = getStationInsight(station);
                  return (
                    <div className="mt-3 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                      <p className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                        {insight.profile}
                      </p>
                      <p className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                        {insight.peak}
                      </p>
                      <p className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">
                        {insight.connectivity}
                      </p>
                      <p className="rounded-md bg-blue-100/70 px-2 py-1 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                        {insight.note}
                      </p>
                    </div>
                  );
                })()}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {isHealthLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Checking provider health...
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span>Overall</span>
                <Badge variant={health?.status === 'ok' ? 'success' : 'outline'}>
                  {health?.status || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span>Database</span>
                <Badge variant={health?.checks?.database === 'up' ? 'success' : 'outline'}>
                  {health?.checks?.database || 'unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span>Redis</span>
                <Badge variant={health?.checks?.redis === 'up' ? 'success' : 'outline'}>
                  {health?.checks?.redis || 'unknown'}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StationsList;
