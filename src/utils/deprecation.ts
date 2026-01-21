/**
 * Deprecation Utilities
 *
 * Provides utilities for managing deprecated code during migration.
 * Shows warnings in development and logs in production.
 *
 * @example
 * ```ts
 * // In a deprecated function
 * export function useOldCalculations() {
 *   deprecationWarning(
 *     'useOldCalculations',
 *     'useCalculation from @/services/calculation',
 *     'v2.0.0'
 *   )
 *
 *   // Delegate to new implementation
 *   return useCalculation()
 * }
 * ```
 */

import { logger } from '@/infrastructure/logger'

/** Track which warnings have been shown to avoid spam */
const shownWarnings = new Set<string>()

/**
 * Log a deprecation warning
 *
 * @param oldName - The deprecated function/component name
 * @param newName - The replacement to use instead
 * @param removeIn - Version when deprecated code will be removed
 */
export function deprecationWarning(
  oldName: string,
  newName: string,
  removeIn: string
): void {
  const key = `${oldName}->${newName}`

  // Only warn once per session to avoid console spam
  if (shownWarnings.has(key)) return
  shownWarnings.add(key)

  const message = `DEPRECATED: ${oldName} is deprecated. Use ${newName} instead. Will be removed in ${removeIn}.`

  // Log to structured logger
  logger.warn(message, { oldName, newName, removeIn })

  // Show prominent console warning in development
  if (import.meta.env.DEV) {
    console.warn(
      `%c DEPRECATED %c ${oldName} → ${newName} (remove in ${removeIn})`,
      'background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: #ff9800;'
    )
  }
}

/**
 * Create a deprecated function wrapper that delegates to a new implementation
 *
 * @example
 * ```ts
 * export const calculateTotals = createDeprecatedWrapper(
 *   'calculateTotals',
 *   'CalculationService.calculate',
 *   'v2.0.0',
 *   (items) => calculationService.calculate(items)
 * )
 * ```
 */
export function createDeprecatedWrapper<TArgs extends unknown[], TReturn>(
  oldName: string,
  newName: string,
  removeIn: string,
  newImplementation: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  return (...args: TArgs): TReturn => {
    deprecationWarning(oldName, newName, removeIn)
    return newImplementation(...args)
  }
}

/**
 * Mark a class method as deprecated
 *
 * @example
 * ```ts
 * class MyService {
 *   @deprecated('newMethod', 'v2.0.0')
 *   oldMethod() {
 *     return this.newMethod()
 *   }
 * }
 * ```
 */
export function deprecated(newName: string, removeIn: string) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: unknown[]) {
      deprecationWarning(propertyKey, newName, removeIn)
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * Clear shown warnings (useful for testing)
 */
export function clearDeprecationWarnings(): void {
  shownWarnings.clear()
}

/**
 * Get all shown deprecation warnings (useful for auditing)
 */
export function getShownWarnings(): string[] {
  return Array.from(shownWarnings)
}
