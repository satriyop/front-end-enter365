import { ref, computed, type Ref } from 'vue'

export interface BulkSelectionOptions<T> {
  items: Ref<T[]>
  getItemId: (item: T) => number | string
}

export function useBulkSelection<T>(options: BulkSelectionOptions<T>) {
  const { items, getItemId } = options

  const selectedIds = ref<Set<number | string>>(new Set())

  const selectedCount = computed(() => selectedIds.value.size)

  const isAllSelected = computed(() => {
    if (items.value.length === 0) return false
    return items.value.every(item => selectedIds.value.has(getItemId(item)))
  })

  const isSomeSelected = computed(() => {
    return selectedIds.value.size > 0 && !isAllSelected.value
  })

  const isSelected = (item: T): boolean => {
    return selectedIds.value.has(getItemId(item))
  }

  const toggleItem = (item: T): void => {
    const id = getItemId(item)
    const newSet = new Set(selectedIds.value)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    selectedIds.value = newSet
  }

  const toggleAll = (): void => {
    if (isAllSelected.value) {
      selectedIds.value = new Set()
    } else {
      selectedIds.value = new Set(items.value.map(getItemId))
    }
  }

  const clearSelection = (): void => {
    selectedIds.value = new Set()
  }

  const getSelectedItems = (): T[] => {
    return items.value.filter(item => selectedIds.value.has(getItemId(item)))
  }

  const getSelectedIds = (): (number | string)[] => {
    return Array.from(selectedIds.value)
  }

  return {
    selectedIds,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    isSelected,
    toggleItem,
    toggleAll,
    clearSelection,
    getSelectedItems,
    getSelectedIds,
  }
}
