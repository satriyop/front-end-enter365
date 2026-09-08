import { describe, expect, it } from 'vitest'
import { FISCAL_LOCK_DATE_FIELDS } from '../fiscalLockDates'

describe('fiscal lock dates', () => {
  it('exposes Odoo Lock Dates fields', () => {
    const labels = FISCAL_LOCK_DATE_FIELDS.map((field) => field.label)

    expect(labels).toEqual([
      'Lock Sales',
      'Lock Purchases',
      'Lock Tax Return',
      'Lock Everything',
      'Hard Lock',
    ])
  })
})
