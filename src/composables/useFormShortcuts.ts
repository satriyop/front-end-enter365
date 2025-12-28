import { onMounted, onUnmounted } from 'vue'

interface FormShortcutsOptions {
  onSave?: () => void | Promise<void>
  onCancel?: () => void
  enabled?: () => boolean
}

/**
 * Add keyboard shortcuts for forms
 * - Ctrl+S to save
 * - Escape to cancel (if handler provided)
 */
export function useFormShortcuts(options: FormShortcutsOptions) {
  const { onSave, onCancel, enabled = () => true } = options

  function handleKeydown(e: KeyboardEvent) {
    if (!enabled()) return

    // Ctrl+S or Cmd+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      onSave?.()
      return
    }

    // Escape to cancel (only if not in input)
    if (e.key === 'Escape' && onCancel) {
      const target = e.target as HTMLElement
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        onCancel()
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}
