/**
 * Performance Monitor
 *
 * Tracks and measures application performance metrics.
 * Provides utilities for measuring sync/async operations
 * and tracking performance over time.
 *
 * @example
 * ```ts
 * import { performanceMonitor } from '@/infrastructure'
 *
 * // Measure sync operation
 * performanceMonitor.mark('data-processing')
 * processData()
 * const duration = performanceMonitor.measure('data-processing')
 *
 * // Measure async operation
 * const result = await performanceMonitor.measureAsync('api-call', async () => {
 *   return await fetchData()
 * })
 * ```
 */

import { logger } from '../logger'

export interface PerformanceMetric {
  /** Name of the measured operation */
  name: string
  /** Duration in milliseconds */
  duration: number
  /** Unix timestamp when measurement was recorded */
  timestamp: number
  /** Optional metadata about the operation */
  metadata?: Record<string, unknown>
}

export interface PerformanceSummary {
  /** Number of measurements */
  count: number
  /** Average duration in ms */
  avg: number
  /** Maximum duration in ms */
  max: number
  /** Minimum duration in ms */
  min: number
}

/** Threshold in ms above which operations are considered slow */
const SLOW_OPERATION_THRESHOLD = 1000

/**
 * Performance Monitor class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private marks = new Map<string, number>()
  private enabled = true
  private maxMetrics = 1000

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Set maximum number of metrics to retain
   */
  setMaxMetrics(max: number): void {
    this.maxMetrics = max
    this.pruneMetrics()
  }

  /**
   * Start a performance measurement
   */
  mark(name: string): void {
    if (!this.enabled) return
    this.marks.set(name, performance.now())
  }

  /**
   * End a performance measurement and record the duration
   */
  measure(name: string, metadata?: Record<string, unknown>): number | null {
    if (!this.enabled) return null

    const startTime = this.marks.get(name)
    if (startTime === undefined) {
      logger.warn(`Performance mark not found: ${name}`)
      return null
    }

    const duration = performance.now() - startTime
    this.marks.delete(name)

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    }

    this.recordMetric(metric)

    return duration
  }

  /**
   * Measure an async operation
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) {
      return operation()
    }

    this.mark(name)
    try {
      const result = await operation()
      this.measure(name, metadata)
      return result
    } catch (error) {
      this.measure(name, { ...metadata, error: true })
      throw error
    }
  }

  /**
   * Measure a sync operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, unknown>
  ): T {
    if (!this.enabled) {
      return operation()
    }

    this.mark(name)
    try {
      const result = operation()
      this.measure(name, metadata)
      return result
    } catch (error) {
      this.measure(name, { ...metadata, error: true })
      throw error
    }
  }

  /**
   * Record a pre-measured metric
   */
  recordMetric(metric: PerformanceMetric): void {
    if (!this.enabled) return

    this.metrics.push(metric)

    // Log slow operations
    if (metric.duration > SLOW_OPERATION_THRESHOLD) {
      logger.warn(`Slow operation: ${metric.name}`, {
        duration: `${metric.duration.toFixed(2)}ms`,
        ...metric.metadata,
      })
    }

    this.pruneMetrics()
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get performance summary for all operations
   */
  getSummary(): Record<string, PerformanceSummary> {
    const groups = new Map<string, number[]>()

    for (const metric of this.metrics) {
      const durations = groups.get(metric.name) || []
      durations.push(metric.duration)
      groups.set(metric.name, durations)
    }

    const result: Record<string, PerformanceSummary> = {}

    for (const [name, durations] of groups) {
      result[name] = {
        count: durations.length,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        max: Math.max(...durations),
        min: Math.min(...durations),
      }
    }

    return result
  }

  /**
   * Get summary for a specific operation
   */
  getSummaryByName(name: string): PerformanceSummary | null {
    const durations = this.metrics
      .filter((m) => m.name === name)
      .map((m) => m.duration)

    if (durations.length === 0) return null

    return {
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      max: Math.max(...durations),
      min: Math.min(...durations),
    }
  }

  /**
   * Get metrics recorded after a specific timestamp
   */
  getMetricsSince(timestamp: number): PerformanceMetric[] {
    return this.metrics.filter((m) => m.timestamp >= timestamp)
  }

  /**
   * Get slow operations (above threshold)
   */
  getSlowOperations(threshold = SLOW_OPERATION_THRESHOLD): PerformanceMetric[] {
    return this.metrics.filter((m) => m.duration > threshold)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.marks.clear()
  }

  /**
   * Clear only old metrics (older than specified ms)
   */
  clearOlderThan(ms: number): void {
    const cutoff = Date.now() - ms
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff)
  }

  /**
   * Remove excess metrics to stay within limit
   */
  private pruneMetrics(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Create a scoped timer for measuring operations
   */
  createTimer(name: string, metadata?: Record<string, unknown>) {
    const startTime = performance.now()
    let stopped = false

    return {
      /** Stop the timer and record the metric */
      stop: (): number | null => {
        if (stopped || !this.enabled) return null
        stopped = true

        const duration = performance.now() - startTime
        this.recordMetric({
          name,
          duration,
          timestamp: Date.now(),
          metadata,
        })

        return duration
      },
      /** Get elapsed time without stopping */
      elapsed: (): number => performance.now() - startTime,
    }
  }
}

/**
 * Singleton performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor()
