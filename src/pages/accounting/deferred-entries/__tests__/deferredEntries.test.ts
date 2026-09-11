import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('deferred expenses and revenues (#144)', () => {
  it('exposes Deferred Expenses and Deferred Revenues distinct from Loans', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const list = readFileSync(resolve(__dirname, '../DeferredEntryListPage.vue'), 'utf8')
    const detail = readFileSync(resolve(__dirname, '../DeferredEntryDetailPage.vue'), 'utf8')
    const form = readFileSync(resolve(__dirname, '../DeferredEntryFormPage.vue'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../../api/useDeferredEntries.ts'), 'utf8')

    expect(nav).toContain("name: 'Deferred Expenses'")
    expect(nav).toContain('/accounting/deferred-expenses')
    expect(nav).toContain("name: 'Deferred Revenues'")
    expect(nav).toContain('/accounting/deferred-revenues')
    expect(router).toContain("path: 'accounting/deferred-expenses'")
    expect(router).toContain("path: 'accounting/deferred-revenues'")
    expect(router).toContain("path: 'deferred-expenses'")
    expect(router).toContain("path: 'deferred-revenues'")
    expect(sidebar).toContain('sidebar-deferred-expenses')
    expect(sidebar).toContain('sidebar-deferred-revenues')
    expect(list).toContain('New {{ kind === \'expense\' ? \'Deferred Expense\' : \'Deferred Revenue\' }}')
    expect(api).toContain('useConfirmDeferredEntry')
    expect(api).toContain('usePostDeferredRecognition')
    expect(api).toContain('/post-recognition')
    expect(detail).not.toContain('router.push(`')
    expect(form).not.toContain('router.push(`')
    expect(list).not.toContain('router.push(`')
    expect(detail).toContain('editEntry')
  })
})
