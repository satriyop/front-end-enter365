import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyDeliveryProductDefaults } from '../deliveryOrderLineDefaults'

describe('delivery order product lines (#130)', () => {
  it('inherits description and unit from the picked product', () => {
    const item = { product_id: null as number | null, description: '', unit: 'pcs' }
    applyDeliveryProductDefaults(item, { id: 9, name: 'MCB 16A', unit: 'pcs' })
    expect(item.product_id).toBe(9)
    expect(item.description).toBe('MCB 16A')
    expect(item.unit).toBe('pcs')
  })

  it('shows a product picker on the New DO form', () => {
    const form = readFileSync(resolve(__dirname, '../DeliveryOrderFormPage.vue'), 'utf8')
    expect(form).toContain('useProductsLookup')
    expect(form).toContain('applyDeliveryProductDefaults')
    expect(form).toContain('do-item-${index}-product')
    expect(form).toContain('product_id: item.product_id || undefined')
  })
})
