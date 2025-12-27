<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'

const router = useRouter()
const isOpen = ref(false)
const searchQuery = ref('')
const selectedIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

// Types for search items
interface SearchItem {
  type: 'group' | 'action' | 'nav' | 'result'
  label: string
  icon?: string
  path?: string
  subtitle?: string
}

// Quick navigation items (always shown)
const quickActions: SearchItem[] = [
  { type: 'action', label: 'New Quotation', icon: '📝', path: '/quotations/new' },
  { type: 'action', label: 'New Invoice', icon: '📄', path: '/invoices/new' },
  { type: 'action', label: 'New Contact', icon: '👤', path: '/contacts/new' },
  { type: 'action', label: 'New Project', icon: '🏗️', path: '/projects/new' },
  { type: 'action', label: 'New Work Order', icon: '🔧', path: '/work-orders/new' },
]

const navigationItems: SearchItem[] = [
  { type: 'nav', label: 'Dashboard', icon: '🏠', path: '/' },
  { type: 'nav', label: 'Quotations', icon: '📝', path: '/quotations' },
  { type: 'nav', label: 'Invoices', icon: '📄', path: '/invoices' },
  { type: 'nav', label: 'Bills', icon: '📋', path: '/bills' },
  { type: 'nav', label: 'Contacts', icon: '👤', path: '/contacts' },
  { type: 'nav', label: 'Products', icon: '📦', path: '/products' },
  { type: 'nav', label: 'Projects', icon: '🏗️', path: '/projects' },
  { type: 'nav', label: 'Work Orders', icon: '🔧', path: '/work-orders' },
  { type: 'nav', label: 'Inventory', icon: '📊', path: '/inventory' },
  { type: 'nav', label: 'Reports', icon: '📈', path: '/reports' },
]

// Search API
const { data: searchResults, isFetching } = useQuery({
  queryKey: ['search', searchQuery],
  queryFn: async () => {
    if (!searchQuery.value || searchQuery.value.length < 2) return null

    const response = await api.get<{
      contacts: Array<{ id: number; name: string; type: string }>
      products: Array<{ id: number; sku: string; name: string }>
      quotations: Array<{ id: number; quotation_number: string; contact_name: string }>
      invoices: Array<{ id: number; invoice_number: string; contact_name: string }>
      projects: Array<{ id: number; project_number: string; name: string }>
    }>('/search', { params: { q: searchQuery.value } })

    return response.data
  },
  enabled: computed(() => searchQuery.value.length >= 2),
  staleTime: 30 * 1000,
})

// Combined results
const displayItems = computed(() => {
  const query = searchQuery.value.toLowerCase()

  if (!query) {
    return [
      { type: 'group', label: 'Quick Actions' } as SearchItem,
      ...quickActions,
      { type: 'group', label: 'Navigation' } as SearchItem,
      ...navigationItems,
    ]
  }

  const items: SearchItem[] = []

  // Filter navigation and actions by query
  const filteredActions = quickActions.filter(item =>
    item.label.toLowerCase().includes(query)
  )
  const filteredNav = navigationItems.filter(item =>
    item.label.toLowerCase().includes(query)
  )

  if (filteredActions.length > 0) {
    items.push({ type: 'group' as const, label: 'Actions' })
    items.push(...filteredActions)
  }

  if (filteredNav.length > 0) {
    items.push({ type: 'group' as const, label: 'Navigation' })
    items.push(...filteredNav)
  }

  // Add search results from API
  if (searchResults.value) {
    const { contacts, products, quotations, invoices, projects } = searchResults.value

    if (contacts?.length) {
      items.push({ type: 'group' as const, label: 'Contacts' })
      contacts.slice(0, 5).forEach(c => {
        items.push({
          type: 'result' as const,
          label: c.name,
          subtitle: c.type,
          icon: '👤',
          path: `/contacts/${c.id}`,
        })
      })
    }

    if (products?.length) {
      items.push({ type: 'group' as const, label: 'Products' })
      products.slice(0, 5).forEach(p => {
        items.push({
          type: 'result' as const,
          label: p.name,
          subtitle: p.sku,
          icon: '📦',
          path: `/products/${p.id}`,
        })
      })
    }

    if (quotations?.length) {
      items.push({ type: 'group' as const, label: 'Quotations' })
      quotations.slice(0, 5).forEach(q => {
        items.push({
          type: 'result' as const,
          label: q.quotation_number,
          subtitle: q.contact_name,
          icon: '📝',
          path: `/quotations/${q.id}`,
        })
      })
    }

    if (invoices?.length) {
      items.push({ type: 'group' as const, label: 'Invoices' })
      invoices.slice(0, 5).forEach(i => {
        items.push({
          type: 'result' as const,
          label: i.invoice_number,
          subtitle: i.contact_name,
          icon: '📄',
          path: `/invoices/${i.id}`,
        })
      })
    }

    if (projects?.length) {
      items.push({ type: 'group' as const, label: 'Projects' })
      projects.slice(0, 5).forEach(p => {
        items.push({
          type: 'result' as const,
          label: p.name,
          subtitle: p.project_number,
          icon: '🏗️',
          path: `/projects/${p.id}`,
        })
      })
    }
  }

  return items
})

const selectableItems = computed(() =>
  displayItems.value.filter(item => item.type !== 'group')
)

// Keyboard navigation
function handleKeydown(e: KeyboardEvent) {
  // Open on Cmd+K or Ctrl+K
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    isOpen.value = !isOpen.value
    return
  }

  if (!isOpen.value) return

  if (e.key === 'Escape') {
    isOpen.value = false
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, selectableItems.value.length - 1)
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    const item = selectableItems.value[selectedIndex.value]
    if (item?.path) {
      navigateTo(item.path)
    }
  }
}

function navigateTo(path: string) {
  router.push(path)
  isOpen.value = false
  searchQuery.value = ''
  selectedIndex.value = 0
}

// Reset selection when results change
watch(displayItems, () => {
  selectedIndex.value = 0
})

// Focus input when opened
watch(isOpen, (open) => {
  if (open) {
    setTimeout(() => inputRef.value?.focus(), 50)
  } else {
    searchQuery.value = ''
    selectedIndex.value = 0
  }
})

// Global keyboard listener
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Expose open method for external use
defineExpose({
  open: () => { isOpen.value = true },
})
</script>

<template>
  <!-- Trigger button (optional, can be placed in header) -->
  <button
    type="button"
    @click="isOpen = true"
    class="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <span>Search...</span>
    <kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono bg-white rounded border border-slate-300">
      <span class="text-xs">⌘</span>K
    </kbd>
  </button>

  <!-- Modal backdrop -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        @click="isOpen = false"
      />
    </Transition>

    <!-- Modal -->
    <Transition name="slide">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
        @click.self="isOpen = false"
      >
        <div class="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
          <!-- Search input -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Search or type a command..."
              class="flex-1 text-slate-900 placeholder-slate-400 bg-transparent border-none outline-none text-base"
            />
            <div v-if="isFetching" class="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <kbd class="px-1.5 py-0.5 text-xs font-mono text-slate-400 bg-slate-100 rounded">ESC</kbd>
          </div>

          <!-- Results list -->
          <div class="max-h-[60vh] overflow-y-auto py-2">
            <template v-for="(item, index) in displayItems" :key="`${item.type}-${item.label}-${index}`">
              <!-- Group header -->
              <div v-if="item.type === 'group'" class="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">
                {{ item.label }}
              </div>

              <!-- Selectable item -->
              <button
                v-else
                type="button"
                @click="item.path && navigateTo(item.path)"
                @mouseenter="selectedIndex = selectableItems.findIndex(i => i.path === item.path)"
                class="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                :class="selectableItems[selectedIndex]?.path === item.path ? 'bg-primary-50 text-primary-900' : 'hover:bg-slate-50'"
              >
                <span class="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg text-lg">
                  {{ item.icon }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">{{ item.label }}</div>
                  <div v-if="item.subtitle" class="text-sm text-slate-500 truncate">{{ item.subtitle }}</div>
                </div>
                <svg
                  v-if="selectableItems[selectedIndex]?.path === item.path"
                  class="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </template>

            <!-- No results -->
            <div
              v-if="searchQuery && selectableItems.length === 0 && !isFetching"
              class="px-4 py-8 text-center text-slate-500"
            >
              No results found for "{{ searchQuery }}"
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center gap-4 px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
            <span class="flex items-center gap-1">
              <kbd class="px-1 py-0.5 bg-white rounded border border-slate-300">↑</kbd>
              <kbd class="px-1 py-0.5 bg-white rounded border border-slate-300">↓</kbd>
              to navigate
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1 py-0.5 bg-white rounded border border-slate-300">↵</kbd>
              to select
            </span>
            <span class="flex items-center gap-1">
              <kbd class="px-1 py-0.5 bg-white rounded border border-slate-300">esc</kbd>
              to close
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}
</style>
