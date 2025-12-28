import { onMounted, onUnmounted } from 'vue'

export interface ShortcutHandler {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: (e: KeyboardEvent) => void
  description?: string
}

// Global shortcuts registry for help display
export const registeredShortcuts: ShortcutHandler[] = []

/**
 * Register keyboard shortcuts for a component
 * Uses Ctrl on Windows/Linux, works with Cmd on Mac too
 */
export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  function handleKeydown(e: KeyboardEvent) {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape in inputs
      if (e.key !== 'Escape') return
    }

    for (const shortcut of shortcuts) {
      const ctrlOrMeta = e.ctrlKey || e.metaKey // Ctrl on Win/Linux, Cmd on Mac
      const ctrlMatch = shortcut.ctrl ? ctrlOrMeta : !ctrlOrMeta
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
      const altMatch = shortcut.alt ? e.altKey : !e.altKey
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase()

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault()
        shortcut.handler(e)
        return
      }
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
    // Register for help display
    shortcuts.forEach(s => {
      if (s.description && !registeredShortcuts.find(r => r.key === s.key && r.ctrl === s.ctrl)) {
        registeredShortcuts.push(s)
      }
    })
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
}

/**
 * Common shortcuts that can be reused
 */
export const commonShortcuts = {
  escape: (handler: () => void): ShortcutHandler => ({
    key: 'Escape',
    handler,
    description: 'Close modal/dialog',
  }),

  save: (handler: () => void): ShortcutHandler => ({
    key: 's',
    ctrl: true,
    handler,
    description: 'Save',
  }),

  search: (handler: () => void): ShortcutHandler => ({
    key: 'k',
    ctrl: true,
    handler,
    description: 'Open search',
  }),

  new: (handler: () => void): ShortcutHandler => ({
    key: 'n',
    ctrl: true,
    shift: true,
    handler,
    description: 'Create new',
  }),
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: ShortcutHandler): string {
  const parts: string[] = []
  if (shortcut.ctrl) parts.push('Ctrl')
  if (shortcut.shift) parts.push('Shift')
  if (shortcut.alt) parts.push('Alt')
  parts.push(shortcut.key.toUpperCase())
  return parts.join('+')
}
