/**
 * LineItemsService Tests
 */

import { describe, it, expect } from 'vitest'
import { createLineItemsService } from '../LineItemsService'
import type { BaseLineItem } from '../types'

describe('LineItemsService', () => {
  describe('initialization', () => {
    it('creates with default empty items', () => {
      const service = createLineItemsService<BaseLineItem>()
      expect(service.items.value).toHaveLength(0)
      expect(service.hasItems.value).toBe(false)
      expect(service.count.value).toBe(0)
    })

    it('creates with initial items', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100000 },
        { quantity: 2, unit_price: 50000 },
      ])
      expect(service.items.value).toHaveLength(2)
      expect(service.hasItems.value).toBe(true)
      expect(service.count.value).toBe(2)
    })

    it('enforces minimum items on creation', () => {
      const service = createLineItemsService<BaseLineItem>([], { minItems: 1 })
      expect(service.items.value).toHaveLength(1)
      expect(service.canRemove.value).toBe(false)
    })

    it('uses default item values', () => {
      const service = createLineItemsService<BaseLineItem>([], {
        minItems: 1,
        defaultItem: { unit: 'kg', quantity: 10 },
      })
      expect(service.items.value[0]!.unit).toBe('kg')
      expect(service.items.value[0]!.quantity).toBe(10)
    })
  })

  describe('addItem', () => {
    it('adds items correctly', () => {
      const service = createLineItemsService<BaseLineItem>()
      service.addItem({ quantity: 5, unit_price: 50000 })

      expect(service.items.value).toHaveLength(1)
      expect(service.items.value[0]!.quantity).toBe(5)
      expect(service.items.value[0]!.unit_price).toBe(50000)
    })

    it('adds items with default values', () => {
      const service = createLineItemsService<BaseLineItem>([], {
        defaultItem: { unit: 'box' },
      })
      service.addItem()

      expect(service.items.value[0]!.unit).toBe('box')
      expect(service.items.value[0]!.quantity).toBe(1) // From DEFAULT_LINE_ITEM
    })

    it('respects maxItems limit', () => {
      const service = createLineItemsService<BaseLineItem>([], { maxItems: 2 })
      service.addItem({ quantity: 1, unit_price: 100 })
      service.addItem({ quantity: 2, unit_price: 200 })
      service.addItem({ quantity: 3, unit_price: 300 }) // Should be ignored

      expect(service.items.value).toHaveLength(2)
      expect(service.canAdd.value).toBe(false)
    })
  })

  describe('removeItem', () => {
    it('removes items correctly', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
        { quantity: 2, unit_price: 200 },
        { quantity: 3, unit_price: 300 },
      ])

      service.removeItem(1) // Remove middle item

      expect(service.items.value).toHaveLength(2)
      expect(service.items.value[0]!.quantity).toBe(1)
      expect(service.items.value[1]!.quantity).toBe(3)
    })

    it('respects minItems limit', () => {
      const service = createLineItemsService<BaseLineItem>(
        [{ quantity: 1, unit_price: 100 }],
        { minItems: 1 }
      )

      service.removeItem(0) // Should be ignored

      expect(service.items.value).toHaveLength(1)
      expect(service.canRemove.value).toBe(false)
    })

    it('handles invalid index gracefully', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
      ])

      service.removeItem(-1) // Invalid
      service.removeItem(5) // Out of bounds

      expect(service.items.value).toHaveLength(1)
    })
  })

  describe('updateItem', () => {
    it('updates item properties correctly', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
      ])

      service.updateItem(0, {
        quantity: 5,
        discount_type: 'percent',
        discount_value: 10,
      })

      expect(service.items.value[0]!.quantity).toBe(5)
      expect(service.items.value[0]!.unit_price).toBe(100) // Unchanged
      expect(service.items.value[0]!.discount_type).toBe('percent')
      expect(service.items.value[0]!.discount_value).toBe(10)
    })

    it('handles invalid index gracefully', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
      ])

      service.updateItem(5, { quantity: 10 }) // Out of bounds

      expect(service.items.value[0]!.quantity).toBe(1) // Unchanged
    })
  })

  describe('moveItem', () => {
    it('moves items correctly', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
        { quantity: 2, unit_price: 200 },
        { quantity: 3, unit_price: 300 },
      ])

      service.moveItem(0, 2) // Move first to last

      expect(service.items.value[0]!.quantity).toBe(2)
      expect(service.items.value[1]!.quantity).toBe(3)
      expect(service.items.value[2]!.quantity).toBe(1)
    })

    it('handles same index gracefully', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
      ])

      service.moveItem(0, 0) // No-op

      expect(service.items.value[0]!.quantity).toBe(1)
    })
  })

  describe('duplicateItem', () => {
    it('duplicates item correctly', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 5, unit_price: 1000, description: 'Test Item' },
      ])

      service.duplicateItem(0)

      expect(service.items.value).toHaveLength(2)
      expect(service.items.value[1]!.quantity).toBe(5)
      expect(service.items.value[1]!.description).toBe('Test Item')
      expect(service.items.value[1]!.id).toBeUndefined() // ID should be cleared
    })

    it('inserts duplicate after original', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
        { quantity: 2, unit_price: 200 },
        { quantity: 3, unit_price: 300 },
      ])

      service.duplicateItem(1) // Duplicate middle item

      expect(service.items.value).toHaveLength(4)
      expect(service.items.value[1]!.quantity).toBe(2)
      expect(service.items.value[2]!.quantity).toBe(2) // Duplicate
      expect(service.items.value[3]!.quantity).toBe(3)
    })

    it('respects maxItems limit', () => {
      const service = createLineItemsService<BaseLineItem>(
        [{ quantity: 1, unit_price: 100 }],
        { maxItems: 1 }
      )

      service.duplicateItem(0) // Should be ignored

      expect(service.items.value).toHaveLength(1)
    })
  })

  describe('clearItems', () => {
    it('clears all items', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
        { quantity: 2, unit_price: 200 },
      ])

      service.clearItems()

      expect(service.items.value).toHaveLength(0)
    })

    it('respects minItems on clear', () => {
      const service = createLineItemsService<BaseLineItem>(
        [
          { quantity: 1, unit_price: 100 },
          { quantity: 2, unit_price: 200 },
        ],
        { minItems: 1 }
      )

      service.clearItems()

      expect(service.items.value).toHaveLength(1)
    })
  })

  describe('setItems', () => {
    it('replaces all items', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
      ])

      service.setItems([
        { quantity: 5, unit_price: 500 },
        { quantity: 10, unit_price: 1000 },
      ])

      expect(service.items.value).toHaveLength(2)
      expect(service.items.value[0]!.quantity).toBe(5)
      expect(service.items.value[1]!.quantity).toBe(10)
    })
  })

  describe('getItem', () => {
    it('returns item at index', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
        { quantity: 2, unit_price: 200 },
      ])

      const item = service.getItem(1)

      expect(item?.quantity).toBe(2)
    })

    it('returns undefined for invalid index', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
      ])

      expect(service.getItem(5)).toBeUndefined()
      expect(service.getItem(-1)).toBeUndefined()
    })
  })

  describe('findByProductId', () => {
    it('finds item by product ID', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100, product_id: 10 },
        { quantity: 2, unit_price: 200, product_id: 20 },
        { quantity: 3, unit_price: 300, product_id: 30 },
      ])

      const result = service.findByProductId(20)

      expect(result?.index).toBe(1)
      expect(result?.item.quantity).toBe(2)
    })

    it('returns null if not found', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100, product_id: 10 },
      ])

      expect(service.findByProductId(999)).toBeNull()
    })
  })

  describe('validate', () => {
    it('returns valid for correct items', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: 100 },
        { quantity: 2, unit_price: 200 },
      ])

      const result = service.validate()

      expect(result.valid).toBe(true)
      expect(result.errors.size).toBe(0)
    })

    it('detects invalid quantity', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 0, unit_price: 100 },
        { quantity: -1, unit_price: 200 },
      ])

      const result = service.validate()

      expect(result.valid).toBe(false)
      expect(result.errors.get(0)).toContain('Quantity must be greater than 0')
      expect(result.errors.get(1)).toContain('Quantity must be greater than 0')
    })

    it('detects negative unit price', () => {
      const service = createLineItemsService<BaseLineItem>([
        { quantity: 1, unit_price: -50 },
      ])

      const result = service.validate()

      expect(result.valid).toBe(false)
      expect(result.errors.get(0)).toContain('Unit price cannot be negative')
    })

    it('validates required product when configured', () => {
      const service = createLineItemsService<BaseLineItem>(
        [{ quantity: 1, unit_price: 100, product_id: null }],
        { requireProduct: true }
      )

      const result = service.validate()

      expect(result.valid).toBe(false)
      expect(result.errors.get(0)).toContain('Product is required')
    })
  })
})
