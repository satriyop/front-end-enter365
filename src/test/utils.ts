/**
 * Test utilities for Vue components
 * Provides helpers for rendering components with common providers
 */

import { mount, VueWrapper, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia, Pinia } from 'pinia'
import { createRouter, createMemoryHistory, Router, RouteRecordRaw } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { vi } from 'vitest'
import type { Component, Plugin } from 'vue'

/**
 * Default routes for testing
 */
const defaultRoutes: RouteRecordRaw[] = [
  { path: '/', component: { template: '<div>Home</div>' } },
  { path: '/login', component: { template: '<div>Login</div>' } },
]

/**
 * Options for renderWithProviders
 */
interface RenderOptions {
  /** Initial route path */
  initialRoute?: string
  /** Custom routes */
  routes?: RouteRecordRaw[]
  /** Pre-configured Pinia instance */
  pinia?: Pinia
  /** Pre-configured QueryClient */
  queryClient?: QueryClient
  /** Props to pass to component */
  props?: Record<string, unknown>
  /** Slots to pass to component */
  slots?: Record<string, unknown>
  /** Additional plugins */
  plugins?: Plugin[]
}

/**
 * Render result with additional utilities
 */
interface RenderResult {
  wrapper: VueWrapper
  router: Router
  pinia: Pinia
  queryClient: QueryClient
  /** Helper to find by test ID */
  getByTestId: (testId: string) => DOMWrapper<Element>
  /** Helper to find all by test ID */
  getAllByTestId: (testId: string) => DOMWrapper<Element>[]
  /** Helper to check if element exists */
  queryByTestId: (testId: string) => DOMWrapper<Element> | null
  /** Unmount the component */
  unmount: () => void
}

/**
 * Render a component with all common providers
 * Includes: Pinia, Vue Router, Vue Query
 */
export function renderWithProviders(
  component: Component,
  options: RenderOptions = {}
): RenderResult {
  const {
    initialRoute = '/',
    routes = defaultRoutes,
    pinia = createPinia(),
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Don't retry in tests
          gcTime: 0, // Disable garbage collection
        },
      },
    }),
    props = {},
    slots = {},
    plugins = [],
  } = options

  // Set active Pinia
  setActivePinia(pinia)

  // Create router
  const router = createRouter({
    history: createMemoryHistory(),
    routes,
  })
  router.push(initialRoute)

  // Mount component
  const wrapper = mount(component, {
    props,
    slots,
    global: {
      plugins: [
        pinia,
        router,
        [VueQueryPlugin, { queryClient }],
        ...plugins,
      ],
    },
  })

  // Helper functions
  const getByTestId = (testId: string): DOMWrapper<Element> => {
    const element = wrapper.find(`[data-testid="${testId}"]`)
    if (!element.exists()) {
      throw new Error(`Element with test ID "${testId}" not found`)
    }
    return element
  }

  const getAllByTestId = (testId: string): DOMWrapper<Element>[] => {
    return wrapper.findAll(`[data-testid="${testId}"]`)
  }

  const queryByTestId = (testId: string): DOMWrapper<Element> | null => {
    const element = wrapper.find(`[data-testid="${testId}"]`)
    return element.exists() ? element : null
  }

  return {
    wrapper,
    router,
    pinia,
    queryClient,
    getByTestId,
    getAllByTestId,
    queryByTestId,
    unmount: () => wrapper.unmount(),
  }
}

/**
 * Simple render without providers (for unit tests)
 */
export function render(
  component: Component,
  props: Record<string, unknown> = {}
): VueWrapper {
  return mount(component, { props })
}

/**
 * Wait for Vue updates and async operations
 */
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Create a mock function with type safety
 */
export function createMockFn<T extends (...args: never[]) => unknown>() {
  return vi.fn() as unknown as T
}

/**
 * Factory for creating test data
 */
export function createFactory<T>(defaults: T) {
  return (overrides: Partial<T> = {}): T => ({
    ...defaults,
    ...overrides,
  })
}
