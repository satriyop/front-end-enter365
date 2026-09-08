import { describe, expect, it } from 'vitest'
import { reportCategories } from '../reportsCatalog'

describe('reports catalog', () => {
  it('lists Partner Ledger under financial reports', () => {
    const financial = reportCategories.find((category) => category.title === 'Financial Reports')

    expect(financial?.reports.map((report) => report.path)).toContain('/reports/partner-ledger')
    expect(financial?.reports.find((report) => report.path === '/reports/partner-ledger')?.name)
      .toBe('Partner Ledger')
  })
})
