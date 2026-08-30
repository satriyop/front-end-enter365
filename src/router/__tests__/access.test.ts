import { describe, expect, it } from 'vitest'
import { canOpenPath, requiredPermissionForPath } from '../access'

describe('route permission gates', () => {
  it('blocks accountant create/mutate screens', () => {
    const has = (name: string) => ['journals.view', 'reports.financial', 'products.view', 'invoices.view'].includes(name)

    expect(canOpenPath('/products/new', has)).toBe(false)
    expect(canOpenPath('/inventory/opnames/new', has)).toBe(false)
    expect(canOpenPath('/inventory/adjust', has)).toBe(false)
    expect(canOpenPath('/accounting/journal-entries', has)).toBe(true)
    expect(canOpenPath('/reports/trial-balance', has)).toBe(true)
    expect(canOpenPath('/reports/stock-summary', has)).toBe(false)
  })

  it('blocks gudang from journals and trial balance', () => {
    const has = (name: string) => name.startsWith('inventory.') || name === 'products.view' || name === 'stock_opnames.create'

    expect(canOpenPath('/accounting/journal-entries', has)).toBe(false)
    expect(canOpenPath('/reports/trial-balance', has)).toBe(false)
    expect(canOpenPath('/inventory/adjust', has)).toBe(true)
    expect(canOpenPath('/inventory/opnames/new', has)).toBe(true)
  })

  it('maps stock summary to inventory.view', () => {
    expect(requiredPermissionForPath('/reports/stock-summary')).toBe('inventory.view')
    expect(requiredPermissionForPath('/reports/trial-balance')).toBe('reports.financial')
  })
})
