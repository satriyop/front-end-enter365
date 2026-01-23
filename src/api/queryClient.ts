/**
 * TanStack Query Client Configuration
 *
 * Optimized caching strategies for the application.
 */

import { QueryClient, MutationCache } from '@tanstack/vue-query'
import { eventBus } from '@/infrastructure/events/eventBus'
import { getErrorMessage } from './client'

/**
 * Create a configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        // Emit global error event for mutations
        // UI components (like ToastProvider) will listen to this
        eventBus.emit('error:api', {
          endpoint: 'mutation',
          statusCode: 0, // Unknown/generic
          message: getErrorMessage(error),
        })
      },
    }),
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
