import { describe, expect, it } from 'vitest'
import { transferStatusLabel } from '../useStockTransfers'

describe('stock transfer documents', () => {
  it('maps document statuses to Draft / Done', () => {
    expect(transferStatusLabel('draft')).toBe('Draft')
    expect(transferStatusLabel('completed')).toBe('Done')
    expect(transferStatusLabel('cancelled')).toBe('Cancelled')
  })
})
