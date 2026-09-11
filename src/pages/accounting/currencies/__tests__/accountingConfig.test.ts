import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('accounting config masters (#151)', () => {
  it('exposes Currencies, Cash Roundings, and Multi Ledgers', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const access = readFileSync(resolve(__dirname, '../../../../router/access.ts'), 'utf8')
    const currencyList = readFileSync(resolve(__dirname, '../CurrencyListPage.vue'), 'utf8')
    const roundingList = readFileSync(resolve(__dirname, '../../cash-roundings/CashRoundingListPage.vue'), 'utf8')
    const ledgerList = readFileSync(resolve(__dirname, '../../ledgers/LedgerListPage.vue'), 'utf8')
    const currencyForm = readFileSync(resolve(__dirname, '../CurrencyFormPage.vue'), 'utf8')

    expect(nav).toContain("name: 'Currencies'")
    expect(nav).toContain('/accounting/currencies')
    expect(nav).toContain("name: 'Cash Roundings'")
    expect(nav).toContain('/accounting/cash-roundings')
    expect(nav).toContain("name: 'Multi Ledgers'")
    expect(nav).toContain('/accounting/ledgers')
    expect(router).toContain("path: 'currencies'")
    expect(router).toContain("path: 'cash-roundings'")
    expect(router).toContain("path: 'ledgers'")
    expect(access).toContain('/accounting/currencies')
    expect(sidebar).toContain('sidebar-currencies')
    expect(sidebar).toContain('sidebar-cash-roundings')
    expect(sidebar).toContain('sidebar-ledgers')
    expect(currencyList).toContain('New Currency')
    expect(roundingList).toContain('New Cash Rounding')
    expect(ledgerList).toContain('New Ledger')
    expect(currencyForm).not.toContain('router.push(`')
    expect(roundingList).not.toContain('router.push(`')
    expect(ledgerList).not.toContain('router.push(`')
  })
})
