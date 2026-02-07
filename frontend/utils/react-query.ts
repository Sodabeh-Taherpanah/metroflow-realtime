import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Retry failed queries twice
  },
  mutations: {
    onError: error => {
      console.error('Mutation error:', error);
    },
  },
};

const queryClient = new QueryClient({
  defaultOptions,
});

export default queryClient;
