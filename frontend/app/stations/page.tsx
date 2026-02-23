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

const fetchStations = async () => {
  const { data } = await apiClient.get('/vbb/stations?query=Berlin&limit=20');
  return data;
};

const StationsList = () => {
  const {
    data: stations = [],
    isLoading,
    error,
  } = useQuery({ queryKey: ['stations'], queryFn: fetchStations });

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
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800/60 dark:bg-slate-950/40"
              >
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StationsList;
