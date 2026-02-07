/**
 * useUnsavedChanges Tests
 *
 * Tests the route leave guard composable.
 * Mocks vue-router's onBeforeRouteLeave, window.confirm,
 * and window.addEventListener for beforeunload.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import {
  hasUnsavedChanges,
  getUnsavedMessage,
  confirmNavigation,
} from '../useUnsavedChanges'

// Capture the route leave guard callback
let routeLeaveGuard: ((_to: unknown, _from: unknown, next: (val?: boolean | false) => void) => void) | null = null
let unmountCallbacks: (() => void)[] = []

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: vi.fn((cb) => {
    routeLeaveGuard = cb
  }),
}))

// Mock onUnmounted from Vue
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    onUnmounted: vi.fn((cb) => {
      unmountCallbacks.push(cb)
    }),
  }
})

// Import after mocks are set up
const { useUnsavedChanges } = await import('../useUnsavedChanges')

describe('useUnsavedChanges', () => {
  let addEventSpy: ReturnType<typeof vi.spyOn>
  let removeEventSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    routeLeaveGuard = null
    unmountCallbacks = []
    addEventSpy = vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    removeEventSpy = vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    // Clean up any leftover registry entries
    // Simulate unmount of previous tests
    unmountCallbacks.forEach(cb => cb())
    unmountCallbacks = []
  })

  afterEach(() => {
    // Clean up registry by calling unmount callbacks
    unmountCallbacks.forEach(cb => cb())
    unmountCallbacks = []
    vi.restoreAllMocks()
  })

  describe('registration', () => {
    it('adds beforeunload event listener', () => {
      const isDirty = ref(false)
      useUnsavedChanges(isDirty)

      expect(addEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })

    it('registers onBeforeRouteLeave guard', () => {
      const isDirty = ref(false)
      useUnsavedChanges(isDirty)

      expect(routeLeaveGuard).not.toBeNull()
    })
  })

  describe('route leave guard', () => {
    it('calls next() when not dirty', () => {
      const isDirty = ref(false)
      useUnsavedChanges(isDirty)

      const next = vi.fn()
      routeLeaveGuard!({}, {}, next)

      expect(next).toHaveBeenCalledWith()
      expect(window.confirm).not.toHaveBeenCalled()
    })

    it('shows confirm dialog when dirty', () => {
      const isDirty = ref(true)
      useUnsavedChanges(isDirty)

      const next = vi.fn()
      vi.mocked(window.confirm).mockReturnValue(true)

      routeLeaveGuard!({}, {}, next)

      expect(window.confirm).toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith()
    })

    it('blocks navigation when user cancels', () => {
      const isDirty = ref(true)
      useUnsavedChanges(isDirty)

      const next = vi.fn()
      vi.mocked(window.confirm).mockReturnValue(false)

      routeLeaveGuard!({}, {}, next)

      expect(next).toHaveBeenCalledWith(false)
    })

    it('uses custom message', () => {
      const isDirty = ref(true)
      useUnsavedChanges(isDirty, 'Custom warning message')

      const next = vi.fn()
      vi.mocked(window.confirm).mockReturnValue(true)

      routeLeaveGuard!({}, {}, next)

      expect(window.confirm).toHaveBeenCalledWith('Custom warning message')
    })

    it('works with getter function instead of ref', () => {
      let dirty = true
      useUnsavedChanges(() => dirty)

      const next = vi.fn()
      vi.mocked(window.confirm).mockReturnValue(true)

      routeLeaveGuard!({}, {}, next)
      expect(window.confirm).toHaveBeenCalled()

      dirty = false
      const next2 = vi.fn()
      routeLeaveGuard!({}, {}, next2)
      expect(next2).toHaveBeenCalledWith()
    })
  })

  describe('cleanup on unmount', () => {
    it('removes beforeunload listener', () => {
      const isDirty = ref(false)
      useUnsavedChanges(isDirty)

      // Simulate unmount
      unmountCallbacks.forEach(cb => cb())

      expect(removeEventSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })

    it('unregisters from global registry', () => {
      const isDirty = ref(true)
      useUnsavedChanges(isDirty)

      expect(hasUnsavedChanges()).toBe(true)

      // Simulate unmount
      unmountCallbacks.forEach(cb => cb())
      unmountCallbacks = []

      expect(hasUnsavedChanges()).toBe(false)
    })
  })

  describe('markAsSaved', () => {
    it('removes from registry immediately', () => {
      const isDirty = ref(true)
      const { markAsSaved } = useUnsavedChanges(isDirty)

      expect(hasUnsavedChanges()).toBe(true)

      markAsSaved()

      // Even though isDirty is still true, the entry is removed
      expect(hasUnsavedChanges()).toBe(false)
    })
  })
})

describe('hasUnsavedChanges (standalone)', () => {
  beforeEach(() => {
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
    unmountCallbacks = []
  })

  afterEach(() => {
    unmountCallbacks.forEach(cb => cb())
    unmountCallbacks = []
    vi.restoreAllMocks()
  })

  it('returns false when no components are dirty', () => {
    expect(hasUnsavedChanges()).toBe(false)
  })

  it('returns true when any component is dirty', () => {
    useUnsavedChanges(ref(true))
    expect(hasUnsavedChanges()).toBe(true)
  })
})

describe('getUnsavedMessage', () => {
  beforeEach(() => {
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
    unmountCallbacks = []
  })

  afterEach(() => {
    unmountCallbacks.forEach(cb => cb())
    unmountCallbacks = []
    vi.restoreAllMocks()
  })

  it('returns default message when no dirty components', () => {
    expect(getUnsavedMessage()).toContain('unsaved changes')
  })

  it('returns custom message from dirty component', () => {
    useUnsavedChanges(ref(true), 'Form has changes!')
    expect(getUnsavedMessage()).toBe('Form has changes!')
  })
})

describe('confirmNavigation', () => {
  beforeEach(() => {
    vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    unmountCallbacks = []
  })

  afterEach(() => {
    unmountCallbacks.forEach(cb => cb())
    unmountCallbacks = []
    vi.restoreAllMocks()
  })

  it('returns true when no unsaved changes', async () => {
    expect(await confirmNavigation()).toBe(true)
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('shows confirm when unsaved changes exist', async () => {
    useUnsavedChanges(ref(true))
    vi.mocked(window.confirm).mockReturnValue(true)

    expect(await confirmNavigation()).toBe(true)
    expect(window.confirm).toHaveBeenCalled()
  })

  it('returns false when user declines', async () => {
    useUnsavedChanges(ref(true))
    vi.mocked(window.confirm).mockReturnValue(false)

    expect(await confirmNavigation()).toBe(false)
  })
})
