/**
 * Service Container Type Definitions
 */

/**
 * Factory function that creates a service instance
 */
export type ServiceFactory<T> = () => T

/**
 * Service lifetime
 * - singleton: One instance shared across the application
 * - transient: New instance created each time it's resolved
 */
export type ServiceLifetime = 'singleton' | 'transient'

/**
 * Internal service descriptor
 */
export interface ServiceDescriptor<T = unknown> {
  factory: ServiceFactory<T>
  lifetime: ServiceLifetime
  instance?: T
}

/**
 * Service tokens for type-safe dependency injection
 */
export const ServiceTokens = {
  // Infrastructure
  EventBus: 'EventBus',
  Logger: 'Logger',

  // Domain Services (to be added in Phase 2)
  CalculationService: 'CalculationService',
  ValidationService: 'ValidationService',
  WorkflowService: 'WorkflowService',
  ExportService: 'ExportService',
  StatusService: 'StatusService',
} as const

export type ServiceToken = (typeof ServiceTokens)[keyof typeof ServiceTokens]
