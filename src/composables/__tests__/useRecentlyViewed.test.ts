/**
 * useRecentlyViewed Tests
 *
 * Singleton composable with localStorage persistence.
 * Uses onMounted, so we need a component context for init.
 * We reset singleton state between tests via clear() + localStorage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { useRecentlyViewed, type RecentlyViewedItem } from '../useRecentlyViewed'

// Helper to use composable inside a mounted component (triggers onMounted)
function withSetup() {
  let result!: ReturnType<typeof useRecentlyViewed>

  const wrapper = mount(defineComponent({
    setup() {
      result = useRecentlyViewed()
      return {}
    },
    template: '<div />',
  }))

  return { result, wrapper }
}

const sampleItem = {
  type: 'invoice',
  id: 1,
  title: 'INV-001',
  subtitle: 'Customer A',
  path: '/invoices/1',
}

describe('useRecentlyViewed', () => {
  let mockStorage: Record<string, string>

  beforeEach(() => {
    mockStorage = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStorage[key] ?? null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockStorage[key] = value
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete mockStorage[key]
    })

    // Reset singleton state by mounting once and clearing
    const { result } = withSetup()
    result.clear()
  })

  describe('addItem', () => {
    it('adds an item to the list', () => {
      const { result } = withSetup()

      result.addItem(sampleItem)

      expect(result.items.value).toHaveLength(1)
      expect(result.items.value[0]!.title).toBe('INV-001')
    })

    it('adds viewedAt timestamp', () => {
      const { result } = withSetup()

      result.addItem(sampleItem)

      expect(result.items.value[0]!.viewedAt).toBeDefined()
      expect(typeof result.items.value[0]!.viewedAt).toBe('number')
    })

    it('deduplicates by type + id', () => {
      const { result } = withSetup()

      result.addItem(sampleItem)
      result.addItem({ ...sampleItem, title: 'INV-001 Updated' })

      expect(result.items.value).toHaveLength(1)
      expect(result.items.value[0]!.title).toBe('INV-001 Updated')
    })

    it('deduplicates with string id comparison', () => {
      const { result } = withSetup()

      result.addItem({ ...sampleItem, id: '1' })
      result.addItem({ ...sampleItem, id: 1 })

      expect(result.items.value).toHaveLength(1)
    })

    it('puts newest item first', () => {
      const { result } = withSetup()

      result.addItem({ ...sampleItem, id: 1, title: 'First' })
      result.addItem({ ...sampleItem, id: 2, title: 'Second' })

      expect(result.items.value[0]!.title).toBe('Second')
    })

    it('limits to 10 items', () => {
      const { result } = withSetup()

      for (let i = 0; i < 12; i++) {
        result.addItem({ type: 'invoice', id: i, title: `INV-${i}`, path: `/inv/${i}` })
      }

      expect(result.items.value).toHaveLength(10)
      // First item should be the most recently added
      expect(result.items.value[0]!.title).toBe('INV-11')
    })

    it('persists to localStorage', () => {
      const { result } = withSetup()

      result.addItem(sampleItem)

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'enter365:recently-viewed',
        expect.any(String),
      )
    })
  })

  describe('removeItem', () => {
    it('removes item by type and id', () => {
      const { result } = withSetup()

      result.addItem(sampleItem)
      result.removeItem('invoice', 1)

      expect(result.items.value).toHaveLength(0)
    })

    it('does not affect other items', () => {
      const { result } = withSetup()

      result.addItem(sampleItem)
      result.addItem({ type: 'quotation', id: 2, title: 'QUO-001', path: '/q/2' })
      result.removeItem('invoice', 1)

      expect(result.items.value).toHaveLength(1)
      expect(result.items.value[0]!.type).toBe('quotation')
    })
  })

  describe('clear', () => {
    it('removes all items', () => {
      const { result } = withSetup()

      result.addItem(sampleItem)
      result.clear()

      expect(result.items.value).toHaveLength(0)
    })

    it('removes localStorage key', () => {
      const { result } = withSetup()

      result.addItem(sampleItem)
      result.clear()

      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('enter365:recently-viewed')
    })
  })

  describe('groupedItems', () => {
    it('groups items by type', () => {
      const { result } = withSetup()

      result.addItem({ type: 'invoice', id: 1, title: 'INV-1', path: '/i/1' })
      result.addItem({ type: 'invoice', id: 2, title: 'INV-2', path: '/i/2' })
      result.addItem({ type: 'quotation', id: 1, title: 'QUO-1', path: '/q/1' })

      const groups = result.groupedItems.value
      expect(groups['invoice']).toHaveLength(2)
      expect(groups['quotation']).toHaveLength(1)
    })
  })

  describe('getTypeLabel', () => {
    it('returns known label', () => {
      const { result } = withSetup()
      expect(result.getTypeLabel('invoice')).toBe('Invoices')
    })

    it('returns known label for work-order', () => {
      const { result } = withSetup()
      expect(result.getTypeLabel('work-order')).toBe('Work Orders')
    })

    it('capitalizes unknown type', () => {
      const { result } = withSetup()
      expect(result.getTypeLabel('custom')).toBe('Custom')
    })
  })

  describe('getTypeIcon', () => {
    it('returns known emoji', () => {
      const { result } = withSetup()
      expect(result.getTypeIcon('contact')).toBe('👤')
    })

    it('returns default emoji for unknown type', () => {
      const { result } = withSetup()
      expect(result.getTypeIcon('unknown')).toBe('📄')
    })
  })
})
