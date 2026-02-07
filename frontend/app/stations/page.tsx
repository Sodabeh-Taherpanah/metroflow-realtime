'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/api';

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
    data: stations,
    isLoading,
    error,
  } = useQuery({ queryKey: ['stations'], queryFn: fetchStations });

  if (isLoading) return <p>Loading stations...</p>;
  if (error) return <p>Error loading stations.</p>;

  return (
    <div>
      <h1>Stations</h1>
      <ul>
        {stations.map((station: Station) => (
          <li key={station.id}>{station.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default StationsList;
