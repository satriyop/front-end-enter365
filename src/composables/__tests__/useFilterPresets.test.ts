/**
 * useFilterPresets Tests
 *
 * Mocks useToast and localStorage to test preset CRUD,
 * default preset, and filter matching.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useFilterPresets } from '../useFilterPresets'

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

const STORAGE_KEY = 'enter365:filter-presets:invoices'

describe('useFilterPresets', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
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

  function createPresets(filters: Record<string, unknown> = { status: '', search: '' }) {
    const currentFilters = ref(filters)
    return useFilterPresets('invoices', currentFilters)
  }

  describe('initial state', () => {
    it('starts with empty presets', () => {
      const { presets } = createPresets()
      expect(presets.value).toEqual([])
    })

    it('loads existing presets from localStorage', () => {
      const stored = [{ id: 'p1', name: 'Active', filters: { status: 'active' }, createdAt: 1000 }]
      mockStorage[STORAGE_KEY] = JSON.stringify(stored)

      const { presets } = createPresets()
      expect(presets.value).toHaveLength(1)
      expect(presets.value[0]!.name).toBe('Active')
    })

    it('handles corrupted localStorage gracefully', () => {
      mockStorage[STORAGE_KEY] = 'not-json'

      const { presets } = createPresets()
      expect(presets.value).toEqual([])
    })
  })

  describe('savePreset', () => {
    it('saves current filters as new preset', () => {
      const currentFilters = ref({ status: 'active', search: 'test' })
      const { savePreset, presets } = useFilterPresets('invoices', currentFilters)

      const result = savePreset('Active Invoices')

      expect(result).not.toBeNull()
      expect(result!.name).toBe('Active Invoices')
      expect(result!.filters).toEqual({ status: 'active', search: 'test' })
      expect(presets.value).toHaveLength(1)
    })

    it('persists to localStorage', () => {
      const { savePreset } = createPresets()

      savePreset('My Preset')

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String),
      )
    })

    it('shows success toast', () => {
      const { savePreset } = createPresets()

      savePreset('Test')

      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Test'))
    })

    it('rejects empty name', () => {
      const { savePreset } = createPresets()

      const result = savePreset('')

      expect(result).toBeNull()
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('name'))
    })

    it('rejects whitespace-only name', () => {
      const { savePreset } = createPresets()

      const result = savePreset('   ')

      expect(result).toBeNull()
    })

    it('rejects duplicate name (case insensitive)', () => {
      const { savePreset } = createPresets()

      savePreset('Active')
      const result = savePreset('active')

      expect(result).toBeNull()
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('already exists'))
    })

    it('trims preset name', () => {
      const { savePreset } = createPresets()

      const result = savePreset('  My Preset  ')

      expect(result!.name).toBe('My Preset')
    })
  })

  describe('applyPreset', () => {
    it('applies preset filters to current filters', () => {
      const currentFilters = ref<Record<string, unknown>>({ status: '', search: '' })
      const { applyPreset } = useFilterPresets('invoices', currentFilters)

      const preset = {
        id: 'p1',
        name: 'Active',
        filters: { status: 'active' },
        createdAt: Date.now(),
      }

      applyPreset(preset)

      expect(currentFilters.value.status).toBe('active')
    })

    it('resets filters to defaults before applying preset', () => {
      const currentFilters = ref<Record<string, unknown>>({ status: 'overdue', search: 'old' })
      const { applyPreset } = useFilterPresets('invoices', currentFilters)

      applyPreset({
        id: 'p1',
        name: 'Just Status',
        filters: { status: 'active' },
        createdAt: Date.now(),
      })

      // search should be reset to default (empty string)
      expect(currentFilters.value.search).toBe('')
      expect(currentFilters.value.status).toBe('active')
    })

    it('shows success toast', () => {
      const { applyPreset } = createPresets()

      applyPreset({ id: 'p1', name: 'Test', filters: {}, createdAt: Date.now() })

      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Test'))
    })
  })

  describe('deletePreset', () => {
    it('removes preset by id', () => {
      const { savePreset, deletePreset, presets } = createPresets()

      const preset = savePreset('To Delete')!
      expect(presets.value).toHaveLength(1)

      deletePreset(preset.id)

      expect(presets.value).toHaveLength(0)
    })

    it('shows success toast', () => {
      const { savePreset, deletePreset } = createPresets()

      const preset = savePreset('Bye')!
      vi.clearAllMocks()
      deletePreset(preset.id)

      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Bye'))
    })

    it('does nothing for unknown id', () => {
      const { savePreset, deletePreset, presets } = createPresets()

      savePreset('Keep')
      deletePreset('nonexistent')

      expect(presets.value).toHaveLength(1)
    })
  })

  describe('setDefaultPreset', () => {
    it('sets a preset as default', () => {
      const { savePreset, setDefaultPreset, defaultPreset } = createPresets()

      const preset = savePreset('Default One')!
      setDefaultPreset(preset.id)

      expect(defaultPreset.value?.id).toBe(preset.id)
    })

    it('clears default when set to null', () => {
      const { savePreset, setDefaultPreset, defaultPreset } = createPresets()

      const preset = savePreset('Default One')!
      setDefaultPreset(preset.id)
      setDefaultPreset(null)

      expect(defaultPreset.value).toBeUndefined()
    })

    it('only one preset can be default', () => {
      const { savePreset, setDefaultPreset, presets } = createPresets()

      const p1 = savePreset('First')!
      const p2 = savePreset('Second')!

      setDefaultPreset(p1.id)
      setDefaultPreset(p2.id)

      const defaults = presets.value.filter(p => p.isDefault)
      expect(defaults).toHaveLength(1)
      expect(defaults[0]!.id).toBe(p2.id)
    })
  })

  describe('updatePreset', () => {
    it('updates preset filters with current filters', () => {
      const currentFilters = ref<Record<string, unknown>>({ status: 'active' })
      const { savePreset, updatePreset, presets } = useFilterPresets('invoices', currentFilters)

      const preset = savePreset('Old Filters')!

      // Change current filters and update
      currentFilters.value = { status: 'overdue' }
      updatePreset(preset.id)

      expect(presets.value[0]!.filters).toEqual({ status: 'overdue' })
    })

    it('shows success toast', () => {
      const { savePreset, updatePreset } = createPresets()

      const preset = savePreset('Updatable')!
      vi.clearAllMocks()
      updatePreset(preset.id)

      expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('Updated'))
    })
  })

  describe('renamePreset', () => {
    it('renames a preset', () => {
      const { savePreset, renamePreset, presets } = createPresets()

      const preset = savePreset('Old Name')!
      renamePreset(preset.id, 'New Name')

      expect(presets.value[0]!.name).toBe('New Name')
    })

    it('trims the new name', () => {
      const { savePreset, renamePreset, presets } = createPresets()

      const preset = savePreset('Original')!
      renamePreset(preset.id, '  Trimmed  ')

      expect(presets.value[0]!.name).toBe('Trimmed')
    })

    it('does nothing for empty name', () => {
      const { savePreset, renamePreset, presets } = createPresets()

      const preset = savePreset('Keep This')!
      renamePreset(preset.id, '')

      expect(presets.value[0]!.name).toBe('Keep This')
    })
  })

  describe('matchesPreset / activePreset', () => {
    it('detects matching preset', () => {
      const currentFilters = ref<Record<string, unknown>>({ status: 'active' })
      const { savePreset, activePreset } = useFilterPresets('invoices', currentFilters)

      savePreset('Active')

      expect(activePreset.value).toBeDefined()
      expect(activePreset.value!.name).toBe('Active')
    })

    it('returns undefined when no preset matches', () => {
      const currentFilters = ref<Record<string, unknown>>({ status: 'active' })
      const { savePreset, activePreset } = useFilterPresets('invoices', currentFilters)

      savePreset('Active')
      currentFilters.value = { status: 'overdue' }

      expect(activePreset.value).toBeUndefined()
    })
  })
})
