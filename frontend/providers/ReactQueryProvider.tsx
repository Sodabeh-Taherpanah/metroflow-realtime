'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useMemo } from 'react';

export function ReactQueryProvider({ children }: { children: ReactNode }) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
    []
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
