import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('loans (#143)', () => {
  it('exposes Loans and Loans Analysis distinct from Assets', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const list = readFileSync(resolve(__dirname, '../LoanListPage.vue'), 'utf8')
    const analysis = readFileSync(resolve(__dirname, '../../loans-analysis/LoansAnalysisPage.vue'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../../api/useLoans.ts'), 'utf8')
    const detail = readFileSync(resolve(__dirname, '../LoanDetailPage.vue'), 'utf8')
    const form = readFileSync(resolve(__dirname, '../LoanFormPage.vue'), 'utf8')

    expect(nav).toContain("name: 'Loans'")
    expect(nav).toContain('/accounting/loans')
    expect(nav).toContain("name: 'Loans Analysis'")
    expect(nav).toContain('/accounting/loans-analysis')
    expect(router).toContain("path: 'accounting/loans'")
    expect(router).toContain("path: 'accounting/loans-analysis'")
    expect(router).toContain("path: 'loans'")
    expect(router).toContain("path: 'loans-analysis'")
    expect(sidebar).toContain('sidebar-loans')
    expect(sidebar).toContain('sidebar-loans-analysis')
    expect(list).toContain('New Loan')
    expect(analysis).toContain('Loans Analysis')
    expect(api).toContain('useConfirmLoan')
    expect(api).toContain('usePostLoanInstallment')
    expect(api).toContain('/loans-analysis')
    expect(detail).not.toContain('router.push(`')
    expect(form).not.toContain('router.push(`')
    expect(analysis).not.toContain('router.push(`')
    expect(detail).toContain('editLoan')
  })
})
