/**
 * Performance Composable
 *
 * Vue composable for performance monitoring in components.
 *
 * @example
 * ```ts
 * const { track, trackAsync } = usePerformance()
 *
 * // Track component mount time
 * onMounted(() => track('MyComponent:mounted'))
 *
 * // Track async operation
 * const data = await trackAsync('fetchProducts', () => api.get('/products'))
 * ```
 */

import { onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { performanceMonitor } from './PerformanceMonitor'

/**
 * Vue composable for performance monitoring
 */
export function usePerformance() {
  const instance = getCurrentInstance()
  const componentName = instance?.type?.name || instance?.type?.__name || 'Anonymous'

  /**
   * Create a scoped timer
   */
  function timer(name: string, metadata?: Record<string, unknown>) {
    return performanceMonitor.createTimer(name, { component: componentName, ...metadata })
  }

  /**
   * Mark the start of a measurement
   */
  function mark(name: string): void {
    performanceMonitor.mark(`${componentName}:${name}`)
  }

  /**
   * Measure since the last mark
   */
  function measure(name: string, metadata?: Record<string, unknown>): number | null {
    return performanceMonitor.measure(`${componentName}:${name}`, metadata)
  }

  /**
   * Track a sync operation
   */
  function track<T>(name: string, operation?: () => T, metadata?: Record<string, unknown>): T | void {
    const fullName = `${componentName}:${name}`

    if (operation) {
      return performanceMonitor.measureSync(fullName, operation, metadata)
    } else {
      // Just record a marker (useful for lifecycle events)
      performanceMonitor.recordMetric({
        name: fullName,
        duration: 0,
        timestamp: Date.now(),
        metadata: { marker: true, ...metadata },
      })
    }
  }

  /**
   * Track an async operation
   */
  async function trackAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    return performanceMonitor.measureAsync(`${componentName}:${name}`, operation, metadata)
  }

  /**
   * Get summary for this component's operations
   */
  function getSummary() {
    const allSummary = performanceMonitor.getSummary()
    const componentSummary: typeof allSummary = {}

    for (const [name, summary] of Object.entries(allSummary)) {
      if (name.startsWith(`${componentName}:`)) {
        componentSummary[name] = summary
      }
    }

    return componentSummary
  }

  return {
    timer,
    mark,
    measure,
    track,
    trackAsync,
    getSummary,
    // Also expose the global monitor for advanced use
    monitor: performanceMonitor,
  }
}

/**
 * Track component lifecycle timing
 *
 * @example
 * ```ts
 * // In setup()
 * useComponentLifecycle()
 * ```
 */
export function useComponentLifecycle() {
  const instance = getCurrentInstance()
  const componentName = instance?.type?.name || instance?.type?.__name || 'Anonymous'
  const mountTimer = performanceMonitor.createTimer(`${componentName}:lifecycle:mount`)

  onMounted(() => {
    mountTimer.stop()
  })

  onUnmounted(() => {
    performanceMonitor.recordMetric({
      name: `${componentName}:lifecycle:unmount`,
      duration: 0,
      timestamp: Date.now(),
      metadata: { marker: true },
    })
  })
}
