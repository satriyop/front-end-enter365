import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyMaterialRequisitionProductDefaults } from '../materialRequisitionLineDefaults'

describe('material requisition product lines (#131)', () => {
  it('inherits name and unit from the picked product', () => {
    const item = { product_id: null as number | null, description: '', unit: 'unit' }
    applyMaterialRequisitionProductDefaults(item, { id: 4, name: 'Copper Busbar', unit: 'm' })
    expect(item.product_id).toBe(4)
    expect(item.description).toBe('Copper Busbar')
    expect(item.unit).toBe('m')
  })

  it('requires a product picker on the New MR form', () => {
    const form = readFileSync(resolve(__dirname, '../MaterialRequisitionFormPage.vue'), 'utf8')
    const validation = readFileSync(resolve(__dirname, '../../../../utils/validation.ts'), 'utf8')
    expect(form).toContain('useProductsLookup')
    expect(form).toContain('applyMaterialRequisitionProductDefaults')
    expect(form).toContain('mr-item-${index}-product')
    expect(form).toContain('product_id: item.product_id || undefined')
    expect(validation).toContain("product_id: z.number({ required_error: 'Please select a product' })")
  })
})
