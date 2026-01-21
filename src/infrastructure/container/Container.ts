/**
 * Service Container (Dependency Injection)
 *
 * A simple IoC container for managing service instances.
 * Supports singleton and transient lifetimes.
 *
 * @example
 * ```ts
 * import { container, ServiceTokens } from '@/infrastructure/container'
 *
 * // Register a service
 * container.register(ServiceTokens.Logger, () => new Logger(), 'singleton')
 *
 * // Resolve a service
 * const logger = container.resolve<Logger>(ServiceTokens.Logger)
 * ```
 */

import type { ServiceDescriptor, ServiceFactory, ServiceLifetime } from './types'

class ServiceContainer {
  private services = new Map<string, ServiceDescriptor>()

  /**
   * Register a service with the container
   *
   * @param token - Unique identifier for the service
   * @param factory - Factory function that creates the service
   * @param lifetime - 'singleton' (default) or 'transient'
   */
  register<T>(
    token: string,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    this.services.set(token, {
      factory,
      lifetime,
      instance: undefined,
    })
  }

  /**
   * Resolve a service from the container
   *
   * @param token - The service token to resolve
   * @returns The service instance
   * @throws Error if service is not registered
   */
  resolve<T>(token: string): T {
    const descriptor = this.services.get(token) as ServiceDescriptor<T> | undefined

    if (!descriptor) {
      throw new Error(
        `Service not registered: ${token}. ` +
          `Make sure to call container.register() before resolving.`
      )
    }

    // For singletons, return cached instance if available
    if (descriptor.lifetime === 'singleton') {
      if (!descriptor.instance) {
        descriptor.instance = descriptor.factory()
      }
      return descriptor.instance
    }

    // For transient, always create new instance
    return descriptor.factory()
  }

  /**
   * Check if a service is registered
   */
  has(token: string): boolean {
    return this.services.has(token)
  }

  /**
   * Remove a service registration
   */
  unregister(token: string): boolean {
    return this.services.delete(token)
  }

  /**
   * Clear all service registrations
   * Useful for testing
   */
  clear(): void {
    this.services.clear()
  }

  /**
   * Get all registered service tokens
   */
  getRegisteredTokens(): string[] {
    return Array.from(this.services.keys())
  }

  /**
   * Reset singleton instance (useful for testing)
   * The service will be recreated on next resolve
   */
  resetInstance(token: string): void {
    const descriptor = this.services.get(token)
    if (descriptor) {
      descriptor.instance = undefined
    }
  }
}

/**
 * Singleton container instance
 */
export const container = new ServiceContainer()
