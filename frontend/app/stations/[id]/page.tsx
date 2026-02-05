'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../utils/api';

const fetchStationDetail = async (id: string) => {
  const { data } = await apiClient.get(`/stations/${id}`);
  return data;
};

const StationDetail = ({ params }: { params: { id: string } }) => {
  const fetchStationDetail = async (id: string) => {
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

  if (isLoading) return <p>Loading station details...</p>;
  if (error) return <p>Error loading station details.</p>;
  if (!station) return <p>Station not found.</p>;

  return (
    <div>
      <h1>{station.name}</h1>
      <p>Location: {station.location}</p>
    </div>
  );
};

export default StationDetail;
