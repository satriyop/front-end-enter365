/**
 * Global test setup for Vitest
 * This file runs before each test file
 */

import { config } from '@vue/test-utils'
import { vi, afterEach } from 'vitest'

// Mock window.matchMedia (required for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver (required for lazy loading)
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Global stubs for common components
config.global.stubs = {
  // Stub router-link and router-view by default
  RouterLink: {
    template: '<a :href="to"><slot /></a>',
    props: ['to'],
  },
  RouterView: {
    template: '<div data-testid="router-view"><slot /></div>',
  },
}

// Global mocks
config.global.mocks = {
  // Add global mocks here if needed
}

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  vi.clearAllMocks()
})
