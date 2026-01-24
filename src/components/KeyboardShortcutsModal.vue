<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from 'radix-vue'
import { X, Command, Keyboard } from 'lucide-vue-next'
import { registeredShortcuts, formatShortcut } from '@/composables/useKeyboardShortcuts'

interface Props {
  open: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

// Group shortcuts by category
interface ShortcutGroup {
  title: string
  shortcuts: Array<{ keys: string; description: string }>
}

const shortcutGroups = computed<ShortcutGroup[]>(() => {
  // Define all shortcuts (both from registry and hardcoded common ones)
  const allShortcuts: ShortcutGroup[] = [
    {
      title: 'Global',
      shortcuts: [
        { keys: '⌘ K', description: 'Open command palette' },
        { keys: '?', description: 'Show keyboard shortcuts' },
        { keys: 'Esc', description: 'Close modal / dialog' },
      ],
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: 'G H', description: 'Go to Dashboard' },
        { keys: 'G Q', description: 'Go to Quotations' },
        { keys: 'G I', description: 'Go to Invoices' },
        { keys: 'G C', description: 'Go to Contacts' },
        { keys: 'G P', description: 'Go to Products' },
        { keys: 'G B', description: 'Go to BOMs' },
      ],
    },
    {
      title: 'Forms',
      shortcuts: [
        { keys: '⌘ S', description: 'Save form' },
        { keys: '⌘ ⇧ N', description: 'Create new item' },
        { keys: '⌘ Enter', description: 'Submit form' },
      ],
    },
    {
      title: 'Tables',
      shortcuts: [
        { keys: '⌘ A', description: 'Select all items' },
        { keys: '⌘ ⇧ A', description: 'Deselect all items' },
        { keys: 'Del', description: 'Delete selected items' },
      ],
    },
  ]

  // Add dynamically registered shortcuts that have descriptions
  const dynamicShortcuts = registeredShortcuts
    .filter(s => s.description)
    .map(s => ({
      keys: formatShortcut(s).replace('Ctrl', '⌘').replace('Shift', '⇧').replace('Alt', '⌥').replace('+', ' '),
      description: s.description!,
    }))

  // Add any dynamic shortcuts not already listed
  if (dynamicShortcuts.length > 0) {
    const existingKeys = new Set(
      allShortcuts.flatMap(g => g.shortcuts.map(s => s.keys))
    )
    const newShortcuts = dynamicShortcuts.filter(s => !existingKeys.has(s.keys))
    if (newShortcuts.length > 0) {
      allShortcuts.push({
        title: 'Other',
        shortcuts: newShortcuts,
      })
    }
  }

  return allShortcuts
})

function handleOpenChange(value: boolean) {
  emit('update:open', value)
}
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpenChange">
    <DialogPortal>
      <!-- Backdrop -->
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

      <!-- Content -->
      <DialogContent class="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Keyboard class="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription class="text-sm text-slate-500">
                Navigate faster with keyboard shortcuts
              </DialogDescription>
            </div>
          </div>
          <DialogClose class="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
            <X class="w-5 h-5" />
          </DialogClose>
        </div>

        <!-- Body -->
        <div class="p-6 max-h-[60vh] overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              v-for="group in shortcutGroups"
              :key="group.title"
              class="space-y-3"
            >
              <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {{ group.title }}
              </h3>
              <div class="space-y-2">
                <div
                  v-for="(shortcut, index) in group.shortcuts"
                  :key="index"
                  class="flex items-center justify-between py-1"
                >
                  <span class="text-sm text-slate-600 dark:text-slate-400">
                    {{ shortcut.description }}
                  </span>
                  <div class="flex items-center gap-1">
                    <kbd
                      v-for="(key, keyIndex) in shortcut.keys.split(' ')"
                      :key="keyIndex"
                      class="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm"
                    >
                      {{ key }}
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div class="flex items-center justify-between text-sm text-slate-500">
            <div class="flex items-center gap-2">
              <Command class="w-4 h-4" />
              <span>Use <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">⌘</kbd> on Mac, <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Ctrl</kbd> on Windows/Linux</span>
            </div>
            <button
              class="text-primary hover:text-primary/80 font-medium"
              @click="handleOpenChange(false)"
            >
              Got it
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
