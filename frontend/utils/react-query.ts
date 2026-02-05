import { QueryClient } from 'react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 2, // Retry failed queries twice
    },
    mutations: {
      onError: error => {
        console.error('Mutation error:', error);
      },
    },
  },
});

export default queryClient;
