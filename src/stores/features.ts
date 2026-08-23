import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'

/**
 * Backend product modules (config/features.php).
 * Layers: core_erp | odoo_packs (MFG/projects) | industry add-ons.
 */
export type FeatureModule = string

/** Fail closed until /features loads — optional packs + industry add-ons */
const OPTIONAL_PACKS = new Set([
  // Odoo-like packs
  'projects',
  'manufacturing',
  'bom',
  'work_orders',
  'material_requisitions',
  'mrp',
  'subcontracting',
  // Industry add-ons
  'solar_proposals',
  'electrical_panel',
  'pos',
])

interface FeaturesPayload {
  preset?: string
  modules: Record<string, boolean>
  enabled: string[]
  disabled: string[]
}

export const useFeaturesStore = defineStore('features', () => {
  const modules = ref<Record<string, boolean>>({})
  const preset = ref<string>('general')
  const loaded = ref(false)
  const loading = ref(false)

  const enabledList = computed(() =>
    Object.entries(modules.value)
      .filter(([, on]) => on)
      .map(([name]) => name),
  )

  /**
   * Whether a product module is enabled.
   * Unknown keys: treat as enabled (core routes without a feature gate).
   * Before first successful fetch: fail closed for optional packs only.
   */
  function enabled(module: string): boolean {
    if (module in modules.value) {
      return modules.value[module] === true
    }

    if (!loaded.value && OPTIONAL_PACKS.has(module)) {
      return false
    }

    return true
  }

  function disabled(module: string): boolean {
    return !enabled(module)
  }

  let inFlight: Promise<void> | null = null

  async function fetchFeatures(): Promise<void> {
    if (loaded.value) {
      return
    }
    if (inFlight) {
      return inFlight
    }

    loading.value = true
    inFlight = (async () => {
      try {
        // Controller: $this->success([...]) → { success, data: FeaturesPayload }
        const response = await api.get<{ data: FeaturesPayload }>('/features')
        const payload = response.data.data
        modules.value = payload.modules ?? {}
        preset.value = payload.preset ?? 'general'
        loaded.value = true
      } catch (error) {
        console.warn('[Features] Failed to load module flags', error)
        loaded.value = false
      } finally {
        loading.value = false
        inFlight = null
      }
    })()

    return inFlight
  }

  function reset(): void {
    modules.value = {}
    preset.value = 'general'
    loaded.value = false
    loading.value = false
    inFlight = null
  }

  return {
    modules,
    preset,
    loaded,
    loading,
    enabledList,
    enabled,
    disabled,
    fetchFeatures,
    reset,
  }
})
