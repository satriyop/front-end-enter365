/**
 * Service Container Module
 *
 * Simple dependency injection for service management.
 *
 * @example
 * ```ts
 * // Register services at app startup
 * import { container, ServiceTokens } from '@/infrastructure/container'
 *
 * container.register(ServiceTokens.Logger, () => new Logger(), 'singleton')
 *
 * // Resolve in components
 * import { useService } from '@/infrastructure/container'
 *
 * const logger = useService<Logger>(ServiceTokens.Logger)
 * ```
 */

// Core
export { container } from './Container'
export { useService, createServiceHook } from './useService'

// Types & Tokens
export type { ServiceFactory, ServiceLifetime, ServiceDescriptor } from './types'
export { ServiceTokens, type ServiceToken } from './types'
