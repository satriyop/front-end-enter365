import { ref, computed, type Ref } from 'vue'
import { useToast } from '@/components/ui'

const STORAGE_KEY_PREFIX = 'enter365:filter-presets:'

export interface FilterPreset {
  id: string
  name: string
  filters: Record<string, unknown>
  createdAt: number
  isDefault?: boolean
}

/**
 * Composable for managing filter presets per module
 *
 * @param module - Module name (e.g., 'quotations', 'invoices')
 * @param currentFilters - Ref to the current filter values
 *
 * @example
 * const filters = ref({ status: '', search: '' })
 * const { presets, savePreset, applyPreset, deletePreset } = useFilterPresets('quotations', filters)
 */
export function useFilterPresets(
  module: string,
  currentFilters: Ref<Record<string, unknown>>
) {
  const toast = useToast()
  const storageKey = `${STORAGE_KEY_PREFIX}${module}`

  // Load presets from storage
  const presets = ref<FilterPreset[]>(loadPresets())

  function loadPresets(): FilterPreset[] {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error)
    }
    return []
  }

  function saveToStorage() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(presets.value))
    } catch (error) {
      console.error('Failed to save filter presets:', error)
    }
  }

  /**
   * Save current filters as a new preset
   */
  function savePreset(name: string): FilterPreset | null {
    if (!name.trim()) {
      toast.error('Please enter a preset name')
      return null
    }

    // Check for duplicate names
    if (presets.value.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error('A preset with this name already exists')
      return null
    }

    const preset: FilterPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: name.trim(),
      filters: { ...currentFilters.value },
      createdAt: Date.now(),
    }

    presets.value.push(preset)
    saveToStorage()
    toast.success(`Filter preset "${name}" saved`)

    return preset
  }

  /**
   * Apply a preset's filters
   */
  function applyPreset(preset: FilterPreset) {
    // Reset to default first, then apply preset values
    const defaultFilters = getDefaultFilters(currentFilters.value)
    Object.assign(currentFilters.value, defaultFilters, preset.filters)
    toast.success(`Applied filter preset "${preset.name}"`)
  }

  /**
   * Delete a preset
   */
  function deletePreset(presetId: string) {
    const index = presets.value.findIndex(p => p.id === presetId)
    if (index !== -1) {
      const name = presets.value[index]?.name
      presets.value.splice(index, 1)
      saveToStorage()
      toast.success(`Deleted preset "${name}"`)
    }
  }

  /**
   * Set a preset as default (auto-apply on page load)
   */
  function setDefaultPreset(presetId: string | null) {
    for (const preset of presets.value) {
      preset.isDefault = preset.id === presetId
    }
    saveToStorage()
  }

  /**
   * Get the default preset (if any)
   */
  const defaultPreset = computed(() =>
    presets.value.find(p => p.isDefault)
  )

  /**
   * Update an existing preset with current filters
   */
  function updatePreset(presetId: string) {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      preset.filters = { ...currentFilters.value }
      saveToStorage()
      toast.success(`Updated preset "${preset.name}"`)
    }
  }

  /**
   * Rename a preset
   */
  function renamePreset(presetId: string, newName: string) {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset && newName.trim()) {
      preset.name = newName.trim()
      saveToStorage()
    }
  }

  /**
   * Check if current filters match a preset
   */
  function matchesPreset(preset: FilterPreset): boolean {
    return JSON.stringify(preset.filters) === JSON.stringify(currentFilters.value)
  }

  /**
   * Get active preset (if any matches current filters)
   */
  const activePreset = computed(() =>
    presets.value.find(p => matchesPreset(p))
  )

  return {
    presets: computed(() => presets.value),
    defaultPreset,
    activePreset,
    savePreset,
    applyPreset,
    deletePreset,
    updatePreset,
    renamePreset,
    setDefaultPreset,
    matchesPreset,
  }
}

/**
 * Get default/empty values for a filter object
 */
function getDefaultFilters(filters: Record<string, unknown>): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}

  for (const key of Object.keys(filters)) {
    const value = filters[key]
    if (typeof value === 'string') {
      defaults[key] = ''
    } else if (typeof value === 'number') {
      defaults[key] = key === 'page' ? 1 : key === 'per_page' ? 10 : 0
    } else if (typeof value === 'boolean') {
      defaults[key] = false
    } else if (Array.isArray(value)) {
      defaults[key] = []
    } else if (value === null) {
      defaults[key] = null
    } else {
      defaults[key] = undefined
    }
  }

  return defaults
}
