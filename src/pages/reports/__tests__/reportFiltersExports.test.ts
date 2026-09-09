import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function pageSource(name: string): string {
  return readFileSync(resolve(__dirname, `../${name}`), 'utf8')
}

describe('report filters and exports (#37 / #99)', () => {
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
    expect(source).toContain('useAnalyticAccountsLookup')
    expect(source).toContain('Posted Entries')
  })

  it('adds journal filters to cash flow, balance sheet, and income statement', () => {
    expect(pageSource('CashFlowPage.vue')).toContain('journalId')
    expect(pageSource('BalanceSheetPage.vue')).toContain('journalId')
    expect(pageSource('IncomeStatementPage.vue')).toContain('journalId')
  })

  it('exports trial balance with journal and posted filters and shows Posted Entries on BS/IS', () => {
    expect(pageSource('TrialBalancePage.vue')).toContain('posted_only: postedOnly.value')
    expect(pageSource('TrialBalancePage.vue')).toContain('journal_id: journalId.value')
    expect(pageSource('BalanceSheetPage.vue')).toContain('Posted Entries')
    expect(pageSource('IncomeStatementPage.vue')).toContain('Posted Entries')
  })

  it('renders VAT journal_grids on the period summary (#104)', () => {
    const page = pageSource('VatReportPage.vue')
    const summary = pageSource('TaxSummaryPage.vue')
    const reports = readFileSync(resolve(__dirname, '../../../api/useReports.ts'), 'utf8')
    expect(reports).toContain('journal_grids')
    expect(page).toContain('journal_grids')
    expect(page).toContain('Tax Grids')
    expect(summary).toContain('journal tax-grid')
  })

  it('exports general ledger without requiring a single account_id (#109)', () => {
    const page = pageSource('GeneralLedgerPage.vue')
    const exports = readFileSync(resolve(__dirname, '../../../api/useExports.ts'), 'utf8')
    expect(page).toContain('useExportGeneralLedger')
    expect(page).toContain('analytic_account_id: analyticAccountId.value')
    expect(page).not.toContain('account_id: accountId')
    expect(exports).toContain('/export/general-ledger')
  })

  it('offers pdf and xlsx export on core financial reports', () => {
    expect(pageSource('CashFlowPage.vue')).not.toContain('show-format-options="false"')
    expect(pageSource('BalanceSheetPage.vue')).not.toContain('show-format-options="false"')
    expect(pageSource('GeneralLedgerPage.vue')).not.toContain('show-format-options="false"')
  })

  it('shows Invoice Date, Due Date, and Matching on partner ledger lines (#74)', () => {
    const source = pageSource('PartnerLedgerPage.vue')
    expect(source).toContain('Invoice Date')
    expect(source).toContain('Due Date')
    expect(source).toContain('Matching')
    expect(source).toContain('entry.invoice_date')
    expect(source).toContain('entry.due_date')
    expect(source).toContain('entry.matching')
  })

  it('offers comparison on balance sheet, income statement, and cash flow', () => {
    expect(pageSource('BalanceSheetPage.vue')).toContain('compareTo')
    expect(pageSource('IncomeStatementPage.vue')).toContain('comparePreviousPeriod')
    expect(pageSource('CashFlowPage.vue')).toContain('comparePreviousPeriod')
  })
})
