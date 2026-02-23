'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type StationDetailResponse = {
  id: string;
  name: string;
  location?: string;
  lines?: string[];
};

const StationDetail = ({ params }: { params: { id: string } }) => {
  const fetchStationDetail = async (id: string): Promise<StationDetailResponse> => {
    const { data } = await apiClient.get(`/stations/${id}`);
    return data;
  };

  const {
    data: station,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['station', params.id],
    queryFn: () => fetchStationDetail(params.id),
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
          Station
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Station details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{station?.name ?? 'Loading station'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading station details...</p>
          ) : error ? (
            <p className="text-sm text-rose-300">Error loading station details.</p>
          ) : !station ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Station not found.</p>
          ) : (
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Location</p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {station.location ?? 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Lines</p>
                <div className="flex flex-wrap gap-2">
                  {(station.lines ?? ['S1', 'S3', 'U5']).map(line => (
                    <Badge key={line} variant="outline">
                      {line}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StationDetail;
