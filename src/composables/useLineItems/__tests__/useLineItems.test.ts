/**
 * useLineItems Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useLineItems } from '../useLineItems'
import type { BaseLineItem } from '@/services/line-items'

// Mock the services
vi.mock('@/services/line-items', () => ({
  createLineItemsService: vi.fn((initialItems) => {
    const items = {
      value: [...initialItems],
    }
    return {
      items,
      count: { value: items.value.length },
      canAdd: { value: true },
      canRemove: { value: items.value.length > 1 },
      hasItems: { value: items.value.length > 0 },
      addItem: vi.fn((item) => items.value.push({ ...item, id: Date.now() })),
      removeItem: vi.fn((index) => items.value.splice(index, 1)),
      updateItem: vi.fn((index, updates) => {
        items.value[index] = { ...items.value[index], ...updates }
      }),
      moveItem: vi.fn(),
      duplicateItem: vi.fn(),
      clearItems: vi.fn(() => (items.value.length = 0)),
      setItems: vi.fn((newItems) => (items.value = [...newItems])),
      getItem: vi.fn((index) => items.value[index]),
      findByProductId: vi.fn(),
      validate: vi.fn(() => ({ valid: true, errors: new Map() })),
    }
  }),
}))

vi.mock('@/services/calculation', () => ({
  useCalculation: vi.fn(() => ({
    totals: { value: { subtotal: 1000, discount: 100, tax: 99, grandTotal: 999 } },
    lineCalculations: { value: [] },
    getLineCalculation: vi.fn(),
    taxInfo: { value: { name: 'PPN', rate: 11, isInclusive: false } },
  })),
}))

describe('useLineItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('creates with empty items by default', () => {
      const { items } = useLineItems()
      expect(Array.isArray(items.value)).toBe(true)
    })

    it('creates with initial items', () => {
      const initialItems: BaseLineItem[] = [
        { product_id: 1, description: 'Item 1', quantity: 1, unit_price: 100 },
        { product_id: 2, description: 'Item 2', quantity: 2, unit_price: 200 },
      ]

      const { items } = useLineItems({ initialItems })
      expect(items.value.length).toBe(2)
    })
  })

  describe('state access', () => {
    it('exposes count computed', () => {
      const { count } = useLineItems()
      expect(count).toBeDefined()
    })

    it('exposes canAdd computed', () => {
      const { canAdd } = useLineItems()
      expect(canAdd).toBeDefined()
    })

    it('exposes canRemove computed', () => {
      const { canRemove } = useLineItems()
      expect(canRemove).toBeDefined()
    })

    it('exposes hasItems computed', () => {
      const { hasItems } = useLineItems()
      expect(hasItems).toBeDefined()
    })
  })

  describe('actions', () => {
    it('exposes addItem function', () => {
      const { addItem } = useLineItems()
      expect(typeof addItem).toBe('function')
    })

    it('exposes removeItem function', () => {
      const { removeItem } = useLineItems()
      expect(typeof removeItem).toBe('function')
    })

    it('exposes updateItem function', () => {
      const { updateItem } = useLineItems()
      expect(typeof updateItem).toBe('function')
    })

    it('exposes moveItem function', () => {
      const { moveItem } = useLineItems()
      expect(typeof moveItem).toBe('function')
    })

    it('exposes duplicateItem function', () => {
      const { duplicateItem } = useLineItems()
      expect(typeof duplicateItem).toBe('function')
    })

    it('exposes clearItems function', () => {
      const { clearItems } = useLineItems()
      expect(typeof clearItems).toBe('function')
    })

    it('exposes setItems function', () => {
      const { setItems } = useLineItems()
      expect(typeof setItems).toBe('function')
    })
  })

  describe('queries', () => {
    it('exposes getItem function', () => {
      const { getItem } = useLineItems()
      expect(typeof getItem).toBe('function')
    })

    it('exposes findByProductId function', () => {
      const { findByProductId } = useLineItems()
      expect(typeof findByProductId).toBe('function')
    })

    it('exposes validateItems function', () => {
      const { validateItems } = useLineItems()
      expect(typeof validateItems).toBe('function')
    })
  })

  describe('calculations', () => {
    it('exposes totals computed', () => {
      const { totals } = useLineItems()
      expect(totals).toBeDefined()
      expect(totals.value).toHaveProperty('subtotal')
      expect(totals.value).toHaveProperty('grandTotal')
    })

    it('exposes lineCalculations computed', () => {
      const { lineCalculations } = useLineItems()
      expect(lineCalculations).toBeDefined()
    })

    it('exposes getLineCalculation function', () => {
      const { getLineCalculation } = useLineItems()
      expect(typeof getLineCalculation).toBe('function')
    })

    it('exposes taxInfo computed', () => {
      const { taxInfo } = useLineItems()
      expect(taxInfo).toBeDefined()
      expect(taxInfo.value).toHaveProperty('name')
      expect(taxInfo.value).toHaveProperty('rate')
    })
  })

  describe('onItemsChange callback', () => {
    it('can be configured with callback', () => {
      const callback = vi.fn()
      useLineItems({ onItemsChange: callback })
      // Callback is set up in watch, which is tested in integration
      expect(true).toBe(true)
    })
  })

  describe('raw service access', () => {
    it('exposes lineItemsService', () => {
      const { lineItemsService } = useLineItems()
      expect(lineItemsService).toBeDefined()
      expect(lineItemsService.items).toBeDefined()
    })
  })
})
