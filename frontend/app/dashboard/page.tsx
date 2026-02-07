'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../utils/api';

const fetchProviderStatus = async () => {
  const { data } = await apiClient.get('/providers/status');
  return data;
};

const ProviderStatusDashboard = () => {
  const {
    data: statuses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['providerStatus'],
    queryFn: fetchProviderStatus,
  });

  if (isLoading) return <p>Loading provider statuses...</p>;
  if (error) return <p>Error loading provider statuses.</p>;

  return (
    <div>
      <h1>Provider Status Dashboard</h1>
      <ul>
        {statuses.map((status: { id: string; name: string; isOnline: boolean }) => (
          <li key={status.id}>
            {status.name}: {status.isOnline ? 'Online' : 'Offline'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProviderStatusDashboard;
