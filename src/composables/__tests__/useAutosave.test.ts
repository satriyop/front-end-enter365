/**
 * useAutosave Tests
 *
 * Tests draft auto-save composable with localStorage persistence.
 * Mocks useToast, localStorage, and timers (setInterval/clearInterval).
 * Uses onMounted/onUnmounted, so we mount a component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { useAutosave, clearAllDrafts } from '../useAutosave'
import type { AutosaveOptions } from '../useAutosave'

// Mock useToast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}

vi.mock('@/components/ui', () => ({
  useToast: () => mockToast,
}))

const STORAGE_KEY = 'enter365:draft:quotation:new'

function withAutosave(overrides: Partial<AutosaveOptions<Record<string, string>>> = {}) {
  let result!: ReturnType<typeof useAutosave>
  const data = ref({ name: '', description: '' })

  const wrapper = mount(defineComponent({
    setup() {
      result = useAutosave({
        module: 'quotation',
        id: 'new',
        data,
        disabled: true, // Disable autosave timer by default in tests
        ...overrides,
        // Always pass data ref
        ...(overrides.data ? {} : { data }),
      })
      return {}
    },
    template: '<div />',
  }))

  return { result, data, wrapper }
}

describe('useAutosave', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    vi.useFakeTimers()
    mockStorage = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] ?? null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete mockStorage[key]
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkDraft', () => {
    it('detects existing draft in localStorage', () => {
      const draft = { data: { name: 'Test' }, savedAt: new Date().toISOString() }
      mockStorage[STORAGE_KEY] = JSON.stringify(draft)

      const { result } = withAutosave()

      // onMounted calls checkDraft
      expect(result.hasDraft.value).toBe(true)
      expect(result.draftData.value).toEqual({ name: 'Test' })
    })

    it('sets hasDraft false when no draft exists', () => {
      const { result } = withAutosave()
      expect(result.hasDraft.value).toBe(false)
    })

    it('handles corrupted localStorage gracefully', () => {
      mockStorage[STORAGE_KEY] = 'not-json'

      const { result } = withAutosave()
      expect(result.hasDraft.value).toBe(false)
    })

    it('handles draft missing data field', () => {
      mockStorage[STORAGE_KEY] = JSON.stringify({ savedAt: new Date().toISOString() })

      const { result } = withAutosave()
      expect(result.hasDraft.value).toBe(false)
    })
  })

  describe('saveDraft', () => {
    it('saves data to localStorage', () => {
      const data = ref({ name: 'My Quotation' })
      const { result } = withAutosave({ data, disabled: false, isDirty: () => true })

      result.saveDraft()

      expect(mockStorage[STORAGE_KEY]).toBeDefined()
      const saved = JSON.parse(mockStorage[STORAGE_KEY]!)
      expect(saved.data).toEqual({ name: 'My Quotation' })
      expect(saved.savedAt).toBeDefined()
    })

    it('sets hasDraft and lastSaved after saving', () => {
      const { result } = withAutosave({ disabled: false, isDirty: () => true })

      result.saveDraft()

      expect(result.hasDraft.value).toBe(true)
      expect(result.lastSaved.value).toBeInstanceOf(Date)
    })

    it('does not save when disabled', () => {
      const { result } = withAutosave({ disabled: true })

      const saved = result.saveDraft()

      expect(saved).toBe(false)
      expect(mockStorage[STORAGE_KEY]).toBeUndefined()
    })

    it('does not save when not dirty', () => {
      const { result } = withAutosave({ disabled: false, isDirty: () => false })

      const saved = result.saveDraft()

      expect(saved).toBe(false)
    })

    it('saves when isDirty is a ref with true', () => {
      const isDirty = ref(true)
      const { result } = withAutosave({ disabled: false, isDirty })

      const saved = result.saveDraft()

      expect(saved).toBe(true)
    })

    it('defaults isDirty to true when not provided', () => {
      const { result } = withAutosave({ disabled: false })

      const saved = result.saveDraft()

      expect(saved).toBe(true)
    })
  })

  describe('restoreDraft', () => {
    it('restores draft data to form', () => {
      const draft = { data: { name: 'Restored', description: 'From draft' }, savedAt: new Date().toISOString() }
      mockStorage[STORAGE_KEY] = JSON.stringify(draft)

      const data = ref({ name: '', description: '' })
      const { result } = withAutosave({ data })

      result.restoreDraft()

      expect(data.value.name).toBe('Restored')
      expect(data.value.description).toBe('From draft')
    })

    it('shows info toast on restore', () => {
      const draft = { data: { name: 'Test' }, savedAt: new Date().toISOString() }
      mockStorage[STORAGE_KEY] = JSON.stringify(draft)

      const { result } = withAutosave()

      result.restoreDraft()

      expect(mockToast.info).toHaveBeenCalledWith('Draft restored')
    })

    it('returns false when no draft exists', () => {
      const { result } = withAutosave()

      expect(result.restoreDraft()).toBe(false)
    })
  })

  describe('clearDraft', () => {
    it('removes draft from localStorage', () => {
      const draft = { data: { name: 'Test' }, savedAt: new Date().toISOString() }
      mockStorage[STORAGE_KEY] = JSON.stringify(draft)

      const { result } = withAutosave()

      result.clearDraft()

      expect(Storage.prototype.removeItem).toHaveBeenCalledWith(STORAGE_KEY)
      expect(result.hasDraft.value).toBe(false)
      expect(result.draftData.value).toBeNull()
      expect(result.lastSaved.value).toBeNull()
    })
  })

  describe('autosave timer', () => {
    it('starts interval on mount when not disabled', () => {
      withAutosave({ disabled: false, isDirty: () => true })

      // Fast forward past the interval (30s default)
      vi.advanceTimersByTime(30000)

      // Should have saved
      expect(mockStorage[STORAGE_KEY]).toBeDefined()
    })

    it('does not start interval when disabled', () => {
      withAutosave({ disabled: true })

      vi.advanceTimersByTime(60000)

      expect(mockStorage[STORAGE_KEY]).toBeUndefined()
    })

    it('stops interval on unmount', () => {
      const { wrapper } = withAutosave({ disabled: false, isDirty: () => false })

      wrapper.unmount()

      // Should not throw or save after unmount
      vi.advanceTimersByTime(60000)
    })

    it('uses custom interval', () => {
      withAutosave({ disabled: false, interval: 5000, isDirty: () => true })

      vi.advanceTimersByTime(5000)

      expect(mockStorage[STORAGE_KEY]).toBeDefined()
    })
  })

  describe('formatLastSaved', () => {
    it('returns empty string when never saved', () => {
      const { result } = withAutosave()
      expect(result.formatLastSaved()).toBe('')
    })

    it('returns "Just now" for < 1 minute', () => {
      const { result } = withAutosave({ disabled: false, isDirty: () => true })

      result.saveDraft()

      expect(result.formatLastSaved()).toBe('Just now')
    })

    it('returns minutes ago for < 60 minutes', () => {
      const { result } = withAutosave({ disabled: false, isDirty: () => true })

      result.saveDraft()
      // Stop autosave so the timer doesn't keep resetting lastSaved
      result.stopAutosave()
      vi.advanceTimersByTime(5 * 60000) // 5 minutes

      expect(result.formatLastSaved()).toBe('5m ago')
    })
  })

  describe('stopAutosave / startAutosave', () => {
    it('can stop and restart autosave', () => {
      const { result } = withAutosave({ disabled: false, isDirty: () => true })

      result.stopAutosave()
      vi.advanceTimersByTime(60000)
      expect(mockStorage[STORAGE_KEY]).toBeUndefined()

      result.startAutosave()
      vi.advanceTimersByTime(30000)
      expect(mockStorage[STORAGE_KEY]).toBeDefined()
    })
  })
})

describe('clearAllDrafts', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('removes all drafts for a module', () => {
    localStorage.setItem('enter365:draft:quotation:new', '{}')
    localStorage.setItem('enter365:draft:quotation:42', '{}')
    localStorage.setItem('enter365:draft:invoice:new', '{}')

    clearAllDrafts('quotation')

    expect(localStorage.getItem('enter365:draft:quotation:new')).toBeNull()
    expect(localStorage.getItem('enter365:draft:quotation:42')).toBeNull()
    // Should not touch invoice drafts
    expect(localStorage.getItem('enter365:draft:invoice:new')).toBe('{}')
  })
})
