import { ref, watch, onMounted, onUnmounted, type Ref } from 'vue'
import { useToast } from '@/components/ui'

const STORAGE_KEY_PREFIX = 'enter365:draft:'
const AUTOSAVE_INTERVAL = 30000 // 30 seconds

export interface AutosaveOptions<T> {
  /** Module name (e.g., 'quotation') */
  module: string
  /** Record ID (use 'new' for new records) */
  id: string | number
  /** Data to save */
  data: Ref<T>
  /** Whether the form is dirty */
  isDirty?: Ref<boolean> | (() => boolean)
  /** Autosave interval in ms (default: 30000) */
  interval?: number
  /** Disable autosave */
  disabled?: boolean
}

/**
 * Composable for auto-saving form drafts to localStorage
 *
 * @example
 * const form = ref({ name: '', description: '' })
 * const { hasDraft, restoreDraft, clearDraft } = useAutosave({
 *   module: 'quotation',
 *   id: route.params.id || 'new',
 *   data: form,
 *   isDirty: () => meta.dirty,
 * })
 *
 * onMounted(() => {
 *   if (hasDraft.value) {
 *     // Show restore prompt
 *   }
 * })
 */
export function useAutosave<T>(options: AutosaveOptions<T>) {
  const toast = useToast()
  const storageKey = `${STORAGE_KEY_PREFIX}${options.module}:${options.id}`

  const hasDraft = ref(false)
  const draftData = ref<T | null>(null)
  const lastSaved = ref<Date | null>(null)

  let autosaveTimer: ReturnType<typeof setInterval> | null = null

  /**
   * Check if a draft exists
   */
  function checkDraft(): boolean {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.data && parsed.savedAt) {
          draftData.value = parsed.data
          lastSaved.value = new Date(parsed.savedAt)
          hasDraft.value = true
          return true
        }
      }
    } catch (error) {
      console.error('Failed to check draft:', error)
    }
    hasDraft.value = false
    draftData.value = null
    return false
  }

  /**
   * Save current data as draft
   */
  function saveDraft(): boolean {
    if (options.disabled) return false

    // Check if dirty
    const isDirty = typeof options.isDirty === 'function'
      ? options.isDirty()
      : options.isDirty?.value ?? true

    if (!isDirty) return false

    try {
      const draft = {
        data: options.data.value,
        savedAt: new Date().toISOString(),
      }
      localStorage.setItem(storageKey, JSON.stringify(draft))
      lastSaved.value = new Date()
      hasDraft.value = true
      return true
    } catch (error) {
      console.error('Failed to save draft:', error)
      return false
    }
  }

  /**
   * Restore draft data
   */
  function restoreDraft(): boolean {
    if (!draftData.value) {
      checkDraft()
    }

    if (draftData.value) {
      Object.assign(options.data.value as object, draftData.value)
      toast.info('Draft restored')
      return true
    }
    return false
  }

  /**
   * Clear the draft
   */
  function clearDraft() {
    try {
      localStorage.removeItem(storageKey)
      hasDraft.value = false
      draftData.value = null
      lastSaved.value = null
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }

  /**
   * Start autosave timer
   */
  function startAutosave() {
    if (autosaveTimer || options.disabled) return

    autosaveTimer = setInterval(() => {
      saveDraft()
    }, options.interval || AUTOSAVE_INTERVAL)
  }

  /**
   * Stop autosave timer
   */
  function stopAutosave() {
    if (autosaveTimer) {
      clearInterval(autosaveTimer)
      autosaveTimer = null
    }
  }

  /**
   * Format last saved time
   */
  function formatLastSaved(): string {
    if (!lastSaved.value) return ''
    const now = new Date()
    const diff = now.getTime() - lastSaved.value.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return lastSaved.value.toLocaleTimeString()
  }

  // Watch for changes and save on significant updates
  watch(
    options.data,
    () => {
      // Don't save immediately on every change - let the timer handle it
      // But update hasDraft if we have unsaved changes
    },
    { deep: true }
  )

  // Check for existing draft on mount
  onMounted(() => {
    checkDraft()
    startAutosave()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopAutosave()
    // Do one final save if dirty
    saveDraft()
  })

  return {
    /** Whether a draft exists */
    hasDraft,
    /** The draft data (if exists) */
    draftData,
    /** When the draft was last saved */
    lastSaved,
    /** Save current data as draft */
    saveDraft,
    /** Restore draft data to form */
    restoreDraft,
    /** Clear the draft */
    clearDraft,
    /** Format last saved time */
    formatLastSaved,
    /** Start autosave timer */
    startAutosave,
    /** Stop autosave timer */
    stopAutosave,
  }
}

/**
 * Clear all drafts for a module
 */
export function clearAllDrafts(module: string) {
  const prefix = `${STORAGE_KEY_PREFIX}${module}:`
  const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix))
  keys.forEach(k => localStorage.removeItem(k))
}
