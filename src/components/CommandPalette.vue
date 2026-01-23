<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  ComboboxRoot,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxItem,
} from 'radix-vue'
import {
  Search,
  FileText,
  Users,
  Package,
  Receipt,
  Layers,
  Settings,
  Home,
  Sun,
  Keyboard,
  Clock,
  ArrowRight,
} from 'lucide-vue-next'
import { useRecentlyViewed, type RecentlyViewedItem } from '@/composables/useRecentlyViewed'
import { useGlobalSearch } from '@/api/useGlobalSearch'

// Types
interface QuickAction {
  id: string
  type: 'navigation' | 'action'
  title: string
  subtitle?: string
  icon: typeof Home
  path?: string
  action?: () => void
  shortcut?: string
}

const router = useRouter()
const { items: recentItems } = useRecentlyViewed()

// State
const isOpen = ref(false)
const searchQuery = ref('')
const debouncedQuery = ref('')
const selectedValue = ref('')

// Update debounced query
const updateDebounced = useDebounceFn((val: string) => {
  debouncedQuery.value = val
}, 300)

watch(searchQuery, (val) => {
  updateDebounced(val)
})

// Use global search hook
const { data: searchResultsData, isLoading: isSearching } = useGlobalSearch(debouncedQuery)

const searchResults = computed(() => searchResultsData.value || [])

// Emit for parent to show shortcuts modal
const emit = defineEmits<{
  'show-shortcuts': []
}>()

// Quick actions / navigation
const quickActions = computed<QuickAction[]>(() => [
  { id: 'home', type: 'navigation', title: 'Dashboard', subtitle: 'Go to home', icon: Home, path: '/', shortcut: 'G H' },
  { id: 'quotations', type: 'navigation', title: 'Quotations', subtitle: 'View all quotations', icon: FileText, path: '/quotations', shortcut: 'G Q' },
  { id: 'invoices', type: 'navigation', title: 'Invoices', subtitle: 'View all invoices', icon: Receipt, path: '/invoices', shortcut: 'G I' },
  { id: 'contacts', type: 'navigation', title: 'Contacts', subtitle: 'View all contacts', icon: Users, path: '/contacts', shortcut: 'G C' },
  { id: 'products', type: 'navigation', title: 'Products', subtitle: 'View all products', icon: Package, path: '/products', shortcut: 'G P' },
  { id: 'boms', type: 'navigation', title: 'Bill of Materials', subtitle: 'View all BOMs', icon: Layers, path: '/boms', shortcut: 'G B' },
  { id: 'solar', type: 'navigation', title: 'Solar Proposals', subtitle: 'View solar proposals', icon: Sun, path: '/solar-proposals' },
  { id: 'settings', type: 'navigation', title: 'Settings', subtitle: 'App settings', icon: Settings, path: '/settings' },
  { id: 'shortcuts', type: 'action', title: 'Keyboard Shortcuts', subtitle: 'View all shortcuts', icon: Keyboard, action: () => { close(); emit('show-shortcuts') }, shortcut: '?' },
])

// Handle selection
function handleSelect(value: string) {
  if (!value) return

  // Check if it's a quick action
  const action = quickActions.value.find(a => a.id === value)
  if (action) {
    if (action.action) {
      action.action()
    } else if (action.path) {
      router.push(action.path)
    }
    close()
    return
  }

  // Check if it's a recent item
  const recent = recentItems.value.find((r: RecentlyViewedItem) => `recent-${r.type}-${r.id}` === value)
  if (recent) {
    router.push(recent.path)
    close()
    return
  }

  // Check if it's a search result
  const result = searchResults.value.find(r => `search-${r.type}-${r.id}` === value)
  if (result) {
    router.push(result.path)
    close()
    return
  }
}

// Open/close
function open() {
  isOpen.value = true
  searchQuery.value = ''
  debouncedQuery.value = ''
}

function close() {
  isOpen.value = false
  searchQuery.value = ''
  debouncedQuery.value = ''
}

// Global keyboard shortcut
function handleGlobalKeydown(e: KeyboardEvent) {
  // Cmd+K or Ctrl+K
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    if (isOpen.value) {
      close()
    } else {
      open()
    }
  }
  // ? for shortcuts (when not in input)
  const target = e.target as HTMLElement
  if (e.key === '?' && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !isOpen.value) {
    e.preventDefault()
    emit('show-shortcuts')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

// Expose open method for external trigger
defineExpose({ open, close })
</script>

<template>
  <DialogRoot :open="isOpen" @update:open="(val) => val ? open() : close()">
    <DialogPortal>
      <!-- Backdrop -->
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

      <!-- Content -->
      <DialogContent class="fixed left-1/2 top-[20%] z-50 w-full max-w-xl -translate-x-1/2 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <ComboboxRoot
          v-model="selectedValue"
          @update:model-value="handleSelect"
        >
          <!-- Search Input -->
          <div class="flex items-center px-4 border-b border-slate-200 dark:border-slate-700">
            <Search class="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
            <ComboboxInput
              :value="searchQuery"
              class="flex-1 h-14 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none text-base"
              placeholder="Search or type a command..."
              @update:model-value="searchQuery = $event"
            />
            <kbd class="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
              <span class="text-sm">⌘</span>K
            </kbd>
          </div>

          <!-- Results -->
          <ComboboxContent class="max-h-[400px] overflow-y-auto p-2">
            <ComboboxEmpty v-if="searchQuery && !isSearching && searchResults.length === 0 && filteredActions.length === 0" class="py-6 text-center text-slate-500">
              No results found for "{{ searchQuery }}"
            </ComboboxEmpty>

            <!-- Loading -->
            <div v-if="isSearching" class="py-4 text-center text-slate-500">
              <div class="animate-spin inline-block w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full" />
            </div>

            <!-- Search Results -->
            <ComboboxGroup v-if="searchResults.length > 0">
              <ComboboxLabel class="px-2 py-1.5 text-xs font-medium text-slate-500">
                Search Results
              </ComboboxLabel>
              <ComboboxItem
                v-for="result in searchResults"
                :key="`search-${result.type}-${result.id}`"
                :value="`search-${result.type}-${result.id}`"
                class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
              >
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <component :is="typeIcons[result.type] || FileText" class="w-4 h-4 text-slate-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ result.title }}</div>
                  <div class="text-xs text-slate-500 truncate">{{ typeLabels[result.type] }} {{ result.subtitle ? `· ${result.subtitle}` : '' }}</div>
                </div>
                <ArrowRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
              </ComboboxItem>
            </ComboboxGroup>

            <!-- Recent Items -->
            <ComboboxGroup v-if="filteredRecent.length > 0">
              <ComboboxLabel class="px-2 py-1.5 text-xs font-medium text-slate-500 flex items-center gap-1">
                <Clock class="w-3 h-3" /> Recently Viewed
              </ComboboxLabel>
              <ComboboxItem
                v-for="item in filteredRecent"
                :key="`recent-${item.type}-${item.id}`"
                :value="`recent-${item.type}-${item.id}`"
                class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
              >
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <component :is="typeIcons[item.type] || FileText" class="w-4 h-4 text-slate-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{{ item.title }}</div>
                  <div class="text-xs text-slate-500">{{ typeLabels[item.type] || item.type }}</div>
                </div>
                <ArrowRight class="w-4 h-4 text-slate-400 flex-shrink-0" />
              </ComboboxItem>
            </ComboboxGroup>

            <!-- Quick Actions -->
            <ComboboxGroup v-if="filteredActions.length > 0">
              <ComboboxLabel class="px-2 py-1.5 text-xs font-medium text-slate-500">
                {{ searchQuery ? 'Actions' : 'Quick Actions' }}
              </ComboboxLabel>
              <ComboboxItem
                v-for="action in filteredActions"
                :key="action.id"
                :value="action.id"
                class="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800"
              >
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <component :is="action.icon" class="w-4 h-4 text-slate-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ action.title }}</div>
                  <div class="text-xs text-slate-500">{{ action.subtitle }}</div>
                </div>
                <kbd v-if="action.shortcut" class="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 rounded">
                  {{ action.shortcut }}
                </kbd>
              </ComboboxItem>
            </ComboboxGroup>
          </ComboboxContent>
        </ComboboxRoot>

        <!-- Footer -->
        <div class="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1">
              <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↑↓</kbd> navigate
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">↵</kbd> select
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">esc</kbd> close
            </span>
          </div>
          <span class="hidden sm:inline">Press <kbd class="px-1 bg-slate-200 dark:bg-slate-700 rounded">?</kbd> for shortcuts</span>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
