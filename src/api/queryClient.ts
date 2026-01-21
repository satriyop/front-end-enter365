/**
 * TanStack Query Client Configuration
 *
 * Optimized caching strategies for the application.
 */

import { QueryClient } from '@tanstack/vue-query'

/**
 * Create a configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 5 minutes by default
        staleTime: 5 * 60 * 1000,

        // Keep unused cache for 30 minutes
        gcTime: 30 * 60 * 1000,

        // Don't refetch on window focus (reduces unnecessary requests)
        refetchOnWindowFocus: false,

        // Retry failed requests once
        retry: 1,

        // Exponential backoff for retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        // Don't retry mutations by default
        retry: false,
      },
    },
  })
}

/**
 * Singleton query client for the application
 */
export const queryClient = createQueryClient()
