import { ref, onMounted, computed } from 'vue'

const STORAGE_KEY = 'enter365:recently-viewed'
const MAX_ITEMS = 10

export interface RecentlyViewedItem {
  type: string // 'quotation', 'invoice', 'contact', etc.
  id: number | string
  title: string
  subtitle?: string
  path: string
  viewedAt: number
}

// Module-level reactive state (singleton pattern)
const items = ref<RecentlyViewedItem[]>([])
let initialized = false

/**
 * Load items from localStorage
 */
function loadFromStorage(): RecentlyViewedItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load recently viewed:', error)
  }
  return []
}

/**
 * Save items to localStorage
 */
function saveToStorage(data: RecentlyViewedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save recently viewed:', error)
  }
}

/**
 * Initialize the store
 */
function init() {
  if (!initialized) {
    items.value = loadFromStorage()
    initialized = true
  }
}

/**
 * Composable for tracking recently viewed items
 *
 * @example
 * // In a detail page
 * const { addItem } = useRecentlyViewed()
 * onMounted(() => {
 *   addItem({
 *     type: 'quotation',
 *     id: route.params.id,
 *     title: `QUO-${quotation.value.number}`,
 *     subtitle: quotation.value.contact.name,
 *     path: `/quotations/${route.params.id}`
 *   })
 * })
 */
export function useRecentlyViewed() {
  onMounted(() => {
    init()
  })

  /**
   * Add an item to recently viewed
   */
  function addItem(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
    init() // Ensure initialized

    // Remove existing entry for same item
    const filtered = items.value.filter(
      i => !(i.type === item.type && String(i.id) === String(item.id))
    )

    // Add new item at the beginning
    const newItem: RecentlyViewedItem = {
      ...item,
      viewedAt: Date.now(),
    }

    // Limit to MAX_ITEMS
    items.value = [newItem, ...filtered].slice(0, MAX_ITEMS)

    // Persist
    saveToStorage(items.value)
  }

  /**
   * Remove an item from recently viewed
   */
  function removeItem(type: string, id: number | string) {
    items.value = items.value.filter(
      i => !(i.type === type && String(i.id) === String(id))
    )
    saveToStorage(items.value)
  }

  /**
   * Clear all recently viewed items
   */
  function clear() {
    items.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Get items grouped by type
   */
  const groupedItems = computed(() => {
    const groups: Record<string, RecentlyViewedItem[]> = {}
    for (const item of items.value) {
      if (!groups[item.type]) {
        groups[item.type] = []
      }
      groups[item.type]!.push(item)
    }
    return groups
  })

  /**
   * Get type label for display
   */
  function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      quotation: 'Quotations',
      invoice: 'Invoices',
      contact: 'Contacts',
      product: 'Products',
      bill: 'Bills',
      payment: 'Payments',
      project: 'Projects',
      'work-order': 'Work Orders',
      bom: 'BOMs',
    }
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1)
  }

  /**
   * Get type icon (emoji for simplicity)
   */
  function getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      quotation: '📄',
      invoice: '📋',
      contact: '👤',
      product: '📦',
      bill: '📑',
      payment: '💰',
      project: '🏗️',
      'work-order': '🔧',
      bom: '📐',
    }
    return icons[type] || '📄'
  }

  return {
    items: computed(() => items.value),
    groupedItems,
    addItem,
    removeItem,
    clear,
    getTypeLabel,
    getTypeIcon,
  }
}
