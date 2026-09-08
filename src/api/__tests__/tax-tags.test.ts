import { describe, expect, it } from 'vitest'
import {
  formatTaxTagLabel,
  taxTagIdsFromTagId,
  taxTagIdsPrimaryId,
} from '../useTaxTags'

describe('tax tag picker helpers', () => {
  it('maps a selected tax tag to tax_tag_ids', () => {
    expect(taxTagIdsFromTagId('7')).toEqual([7])
    expect(taxTagIdsFromTagId(12)).toEqual([12])
    expect(taxTagIdsFromTagId('')).toBeNull()
    expect(taxTagIdsFromTagId(null)).toBeNull()
  })

  it('reads the primary tax tag id', () => {
    expect(taxTagIdsPrimaryId([7, 8])).toBe('7')
    expect(taxTagIdsPrimaryId(null)).toBe('')
  })

  it('labels tax grids using the tax tag master', () => {
    const tags = [
      { id: 7, code: 'BASE-PPN', name: 'PPN Base', applicability: 'base' as const, is_active: true },
      { id: 8, code: 'TAX-PPN', name: 'PPN Tax', applicability: 'tax' as const, is_active: true },
    ]
    expect(formatTaxTagLabel([7, 8], tags)).toBe('BASE-PPN PPN Base, TAX-PPN PPN Tax')
    expect(formatTaxTagLabel([99], tags)).toBe('99')
    expect(formatTaxTagLabel(null, tags)).toBe('')
  })
})
