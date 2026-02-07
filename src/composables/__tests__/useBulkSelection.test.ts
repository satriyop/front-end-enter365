/**
 * useBulkSelection Tests
 *
 * Pure reactive composable — no lifecycle hooks or external deps.
 * Can be tested directly without mounting a component.
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useBulkSelection } from '../useBulkSelection'

interface TestItem {
  id: number
  name: string
}

function createSelection(items: TestItem[] = []) {
  const itemsRef = ref(items)
  const selection = useBulkSelection({
    items: itemsRef,
    getItemId: (item) => item.id,
  })
  return { ...selection, itemsRef }
}

const sampleItems: TestItem[] = [
  { id: 1, name: 'Alpha' },
  { id: 2, name: 'Beta' },
  { id: 3, name: 'Gamma' },
]

describe('useBulkSelection', () => {
  describe('initial state', () => {
    it('starts with no selection', () => {
      const { selectedCount } = createSelection(sampleItems)
      expect(selectedCount.value).toBe(0)
    })

    it('isAllSelected is false with empty selection', () => {
      const { isAllSelected } = createSelection(sampleItems)
      expect(isAllSelected.value).toBe(false)
    })

    it('isSomeSelected is false with empty selection', () => {
      const { isSomeSelected } = createSelection(sampleItems)
      expect(isSomeSelected.value).toBe(false)
    })

    it('isAllSelected is false when items list is empty', () => {
      const { isAllSelected } = createSelection([])
      expect(isAllSelected.value).toBe(false)
    })
  })

  describe('toggleItem', () => {
    it('selects an item', () => {
      const { toggleItem, isSelected } = createSelection(sampleItems)

      toggleItem(sampleItems[0]!)

      expect(isSelected(sampleItems[0]!)).toBe(true)
      expect(isSelected(sampleItems[1]!)).toBe(false)
    })

    it('deselects an already selected item', () => {
      const { toggleItem, isSelected } = createSelection(sampleItems)

      toggleItem(sampleItems[0]!)
      toggleItem(sampleItems[0]!)

      expect(isSelected(sampleItems[0]!)).toBe(false)
    })

    it('updates selectedCount', () => {
      const { toggleItem, selectedCount } = createSelection(sampleItems)

      toggleItem(sampleItems[0]!)
      toggleItem(sampleItems[1]!)

      expect(selectedCount.value).toBe(2)
    })
  })

  describe('toggleAll', () => {
    it('selects all items when none selected', () => {
      const { toggleAll, isAllSelected, selectedCount } = createSelection(sampleItems)

      toggleAll()

      expect(isAllSelected.value).toBe(true)
      expect(selectedCount.value).toBe(3)
    })

    it('deselects all when all selected', () => {
      const { toggleAll, isAllSelected, selectedCount } = createSelection(sampleItems)

      toggleAll() // select all
      toggleAll() // deselect all

      expect(isAllSelected.value).toBe(false)
      expect(selectedCount.value).toBe(0)
    })

    it('selects all when some selected (not all)', () => {
      const { toggleItem, toggleAll, isAllSelected } = createSelection(sampleItems)

      toggleItem(sampleItems[0]!)
      toggleAll()

      expect(isAllSelected.value).toBe(true)
    })
  })

  describe('isSomeSelected (indeterminate state)', () => {
    it('is true when some but not all selected', () => {
      const { toggleItem, isSomeSelected } = createSelection(sampleItems)

      toggleItem(sampleItems[0]!)

      expect(isSomeSelected.value).toBe(true)
    })

    it('is false when all selected', () => {
      const { toggleAll, isSomeSelected } = createSelection(sampleItems)

      toggleAll()

      expect(isSomeSelected.value).toBe(false)
    })

    it('is false when none selected', () => {
      const { isSomeSelected } = createSelection(sampleItems)
      expect(isSomeSelected.value).toBe(false)
    })
  })

  describe('clearSelection', () => {
    it('clears all selections', () => {
      const { toggleAll, clearSelection, selectedCount } = createSelection(sampleItems)

      toggleAll()
      clearSelection()

      expect(selectedCount.value).toBe(0)
    })
  })

  describe('getSelectedItems', () => {
    it('returns selected item objects', () => {
      const { toggleItem, getSelectedItems } = createSelection(sampleItems)

      toggleItem(sampleItems[0]!)
      toggleItem(sampleItems[2]!)

      const selected = getSelectedItems()
      expect(selected).toHaveLength(2)
      expect(selected[0]!.name).toBe('Alpha')
      expect(selected[1]!.name).toBe('Gamma')
    })

    it('returns empty array when nothing selected', () => {
      const { getSelectedItems } = createSelection(sampleItems)
      expect(getSelectedItems()).toEqual([])
    })
  })

  describe('getSelectedIds', () => {
    it('returns selected IDs as array', () => {
      const { toggleItem, getSelectedIds } = createSelection(sampleItems)

      toggleItem(sampleItems[1]!)

      expect(getSelectedIds()).toEqual([2])
    })
  })

  describe('reactivity with items changes', () => {
    it('recalculates isAllSelected when items change', () => {
      const { toggleAll, isAllSelected, itemsRef } = createSelection(sampleItems)

      toggleAll() // select all 3
      expect(isAllSelected.value).toBe(true)

      // Add a new item — now not all are selected
      itemsRef.value = [...sampleItems, { id: 4, name: 'Delta' }]
      expect(isAllSelected.value).toBe(false)
    })
  })
})
