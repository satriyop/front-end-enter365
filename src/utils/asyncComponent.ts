/**
 * Async Component Utility
 *
 * Provides a consistent way to create async (lazy-loaded) components
 * with loading and error states.
 *
 * @example
 * ```typescript
 * const SalesChart = createAsyncComponent({
 *   loader: () => import('@/components/charts/SalesChart.vue'),
 *   loadingText: 'Loading chart...',
 * })
 * ```
 */

import { defineAsyncComponent, h, type Component, type AsyncComponentLoader } from 'vue'
import { Loader2 } from 'lucide-vue-next'

interface AsyncComponentOptions {
  /** Function that returns a promise resolving to a component */
  loader: AsyncComponentLoader<Component>
  /** Text to show while loading */
  loadingText?: string
  /** Text to show on error */
  errorText?: string
  /** Delay before showing loading component (ms) */
  delay?: number
  /** Timeout before showing error (ms) */
  timeout?: number
}

/**
 * Create an async component with loading and error states
 */
export function createAsyncComponent(options: AsyncComponentOptions): Component {
  const {
    loader,
    loadingText = 'Loading...',
    errorText = 'Failed to load component',
    delay = 200,
    timeout = 30000,
  } = options

  return defineAsyncComponent({
    loader,
    delay,
    timeout,

    loadingComponent: {
      render() {
        return h(
          'div',
          {
            class: 'flex items-center justify-center p-8 text-muted-foreground',
          },
          [
            h(Loader2, { class: 'h-5 w-5 animate-spin mr-2' }),
            h('span', loadingText),
          ]
        )
      },
    },

    errorComponent: {
      render() {
        return h(
          'div',
          {
            class: 'p-8 text-center text-destructive',
          },
          errorText
        )
      },
    },
  })
}

/**
 * Create an async component optimized for charts (heavier delay tolerance)
 */
export function createAsyncChart(
  loader: AsyncComponentLoader<Component>,
  chartName = 'chart'
): Component {
  return createAsyncComponent({
    loader,
    loadingText: `Loading ${chartName}...`,
    delay: 300,
    timeout: 60000,
  })
}

/**
 * Create an async component for modals (faster appearance)
 */
export function createAsyncModal(loader: AsyncComponentLoader<Component>): Component {
  return createAsyncComponent({
    loader,
    loadingText: 'Loading...',
    delay: 100,
    timeout: 15000,
  })
}
