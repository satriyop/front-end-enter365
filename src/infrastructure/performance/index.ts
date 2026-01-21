/**
 * Performance Monitoring Module
 *
 * Provides utilities for tracking and measuring application performance.
 *
 * @example
 * ```ts
 * import { performanceMonitor, usePerformance } from '@/infrastructure/performance'
 *
 * // Direct usage
 * performanceMonitor.mark('operation')
 * doSomething()
 * const duration = performanceMonitor.measure('operation')
 *
 * // In Vue components
 * const { track, trackAsync } = usePerformance()
 * await trackAsync('fetchData', () => api.get('/data'))
 * ```
 */

export { performanceMonitor } from './PerformanceMonitor'
export type { PerformanceMetric, PerformanceSummary } from './PerformanceMonitor'

export { usePerformance, useComponentLifecycle } from './usePerformance'
