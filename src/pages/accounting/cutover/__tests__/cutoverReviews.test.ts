import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('period-end cutover reviews (#149)', () => {
  it('exposes the four Odoo Review leaves', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const access = readFileSync(resolve(__dirname, '../../../../router/access.ts'), 'utf8')
    const catalog = readFileSync(resolve(__dirname, '../../../../config/reportsCatalog.ts'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../../api/useCutoverReviews.ts'), 'utf8')
    const page = readFileSync(resolve(__dirname, '../CutoverReviewPage.vue'), 'utf8')

    expect(nav).toContain("name: 'Bill to Receive'")
    expect(nav).toContain('/accounting/bill-to-receive')
    expect(nav).toContain("name: 'Billed Not Received'")
    expect(nav).toContain('/accounting/billed-not-received')
    expect(nav).toContain("name: 'Invoices to Be Issued'")
    expect(nav).toContain('/accounting/invoices-to-be-issued')
    expect(nav).toContain("name: 'Invoiced Not Delivered'")
    expect(nav).toContain('/accounting/invoiced-not-delivered')
    expect(router).toContain("path: 'bill-to-receive'")
    expect(router).toContain("path: 'billed-not-received'")
    expect(router).toContain("path: 'invoices-to-be-issued'")
    expect(router).toContain("path: 'invoiced-not-delivered'")
    expect(access).toContain('/accounting/bill-to-receive')
    expect(sidebar).toContain('sidebar-bill-to-receive')
    expect(sidebar).toContain('sidebar-invoiced-not-delivered')
    expect(catalog).toContain('/accounting/bill-to-receive')
    expect(api).toContain('/reports/cutover/')
    expect(page).toContain('cutover-as-of')
    expect(page).not.toContain('router.push(`')
  })
})
