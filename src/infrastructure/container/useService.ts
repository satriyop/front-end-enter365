/**
 * Vue Composable for Service Container
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useService } from '@/infrastructure/container'
 * import { ServiceTokens } from '@/infrastructure/container'
 * import type { CalculationService } from '@/services/calculation'
 *
 * const calculationService = useService<CalculationService>(ServiceTokens.CalculationService)
 * </script>
 * ```
 */

import { container } from './Container'

/**
 * Resolve a service from the container
 *
 * @param token - Service token to resolve
 * @returns The service instance
 */
export function useService<T>(token: string): T {
  return container.resolve<T>(token)
}

/**
 * Create a type-safe service hook
 * Useful for creating reusable hooks for specific services
 *
 * @example
 * ```ts
 * // In services/calculation/index.ts
 * export const useCalculationService = createServiceHook<CalculationService>(
 *   ServiceTokens.CalculationService
 * )
 *
 * // In component
 * const calc = useCalculationService()
 * ```
 */
export function createServiceHook<T>(token: string): () => T {
  return () => useService<T>(token)
}
