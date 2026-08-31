import { describe, expect, it } from 'vitest'
import { productTypeLabel } from '../productKind'

describe('productTypeLabel', () => {
  it('labels untracked cafe SKUs as Tidak distok on the POS pack', () => {
    expect(productTypeLabel({ type_label: 'Jasa', track_inventory: false }, true)).toBe('Tidak distok')
  })

  it('keeps tracked pastry as Produk', () => {
    expect(productTypeLabel({ type_label: 'Produk', track_inventory: true }, true)).toBe('Produk')
  })

  it('does not rewrite Jasa outside the POS pack', () => {
    expect(productTypeLabel({ type_label: 'Jasa', track_inventory: false }, false)).toBe('Jasa')
  })
})
