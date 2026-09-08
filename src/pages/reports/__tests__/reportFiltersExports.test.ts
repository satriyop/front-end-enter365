import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function pageSource(name: string): string {
  return readFileSync(resolve(__dirname, `../${name}`), 'utf8')
}

describe('report filters and exports (#37)', () => {
  it.each([
    'CashFlowPage.vue',
    'ChangesInEquityPage.vue',
    'DailyCashMovementPage.vue',
  ])('shows Export on %s', (page) => {
    const source = pageSource(page)
    expect(source).toContain('ExportButton')
    expect(source).toContain('handleExport')
  })

  it('filters general ledger by journal and analytic account', () => {
    const source = pageSource('GeneralLedgerPage.vue')
    expect(source).toContain('journalId')
    expect(source).toContain('analyticAccountId')
    expect(source).toContain('All Journals')
  })

  it('offers comparison on balance sheet, income statement, and cash flow', () => {
    expect(pageSource('BalanceSheetPage.vue')).toContain('compareTo')
    expect(pageSource('IncomeStatementPage.vue')).toContain('comparePreviousPeriod')
    expect(pageSource('CashFlowPage.vue')).toContain('comparePreviousPeriod')
  })
})
