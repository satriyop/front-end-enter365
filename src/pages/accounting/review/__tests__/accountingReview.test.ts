import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('accounting review workspace (#150)', () => {
  it('exposes Journal Items, Journal Audit, Working Files, and Audit Trail', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const access = readFileSync(resolve(__dirname, '../../../../router/access.ts'), 'utf8')
    const catalog = readFileSync(resolve(__dirname, '../../../../config/reportsCatalog.ts'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../../api/useAccountingReview.ts'), 'utf8')
    const page = readFileSync(resolve(__dirname, '../AccountingReviewPage.vue'), 'utf8')

    expect(nav).toContain("name: 'Journal Items'")
    expect(nav).toContain('/accounting/journal-items')
    expect(nav).toContain("name: 'Journal Audit'")
    expect(nav).toContain('/accounting/journal-audit')
    expect(nav).toContain("name: 'Working Files'")
    expect(nav).toContain('/accounting/working-files')
    expect(nav).toContain("name: 'Audit Trail'")
    expect(nav).toContain('/accounting/audit-trail')
    expect(router).toContain("path: 'journal-items'")
    expect(router).toContain("path: 'journal-audit'")
    expect(router).toContain("path: 'working-files'")
    expect(router).toContain("path: 'audit-trail'")
    expect(access).toContain('/accounting/journal-items')
    expect(sidebar).toContain('sidebar-journal-items')
    expect(sidebar).toContain('sidebar-audit-trail')
    expect(catalog).toContain('/accounting/journal-items')
    expect(api).toContain('/reports/review/journal-items')
    expect(api).toContain('/reports/review/audit-trail')
    expect(page).toContain('review-from')
    expect(page).not.toContain('router.push(`')
  })
})
