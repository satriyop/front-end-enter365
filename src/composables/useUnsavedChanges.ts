import { onUnmounted, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

/**
 * Global registry of components with unsaved changes
 * Used by router guard to prevent accidental navigation
 */
const unsavedRegistry = new Map<string, { isDirty: () => boolean; message: string }>()

/**
 * Check if any registered component has unsaved changes
 */
export function hasUnsavedChanges(): boolean {
  for (const [, entry] of unsavedRegistry) {
    if (entry.isDirty()) {
      return true
    }
  }
  return false
}

/**
 * Get message for unsaved changes dialog
 */
export function getUnsavedMessage(): string {
  for (const [, entry] of unsavedRegistry) {
    if (entry.isDirty()) {
      return entry.message
    }
  }
  return 'You have unsaved changes. Are you sure you want to leave?'
}

/**
 * Composable to track unsaved changes in a form
 *
 * @param isDirty - Reactive ref or getter function for dirty state
 * @param message - Custom message for the confirmation dialog
 *
 * @example
 * // With vee-validate meta.dirty
 * useUnsavedChanges(() => meta.value.dirty)
 *
 * @example
 * // With manual dirty tracking
 * const isDirty = ref(false)
 * useUnsavedChanges(isDirty)
 */
export function useUnsavedChanges(
  isDirty: Ref<boolean> | (() => boolean),
  message = 'You have unsaved changes. Are you sure you want to leave?'
) {
  const id = `unsaved-${Date.now()}-${Math.random().toString(36).slice(2)}`

  // Getter function for dirty state
  const getDirty = typeof isDirty === 'function' ? isDirty : () => isDirty.value

  // Register with global registry
  unsavedRegistry.set(id, { isDirty: getDirty, message })

  // Handle browser beforeunload event (refresh, close tab)
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (getDirty()) {
      e.preventDefault()
      // Modern browsers ignore custom messages, but we need to set returnValue
      e.returnValue = message
      return message
    }
  }

  window.addEventListener('beforeunload', handleBeforeUnload)

  // Vue Router navigation guard for this component
  onBeforeRouteLeave((_to, _from, next) => {
    if (getDirty()) {
      const confirmed = window.confirm(message)
      if (confirmed) {
        next()
      } else {
        next(false)
      }
    } else {
      next()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    unsavedRegistry.delete(id)
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  return {
    /**
     * Force clear the dirty state (call after successful save)
     */
    markAsSaved: () => {
      unsavedRegistry.delete(id)
    }
  }
}

/**
 * Check registry before navigation (for use in router guard)
 * Returns true if navigation should proceed
 */
export async function confirmNavigation(): Promise<boolean> {
  if (!hasUnsavedChanges()) {
    return true
  }

  return window.confirm(getUnsavedMessage())
}
