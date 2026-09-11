import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('follow-up levels and employee expenses (#153)', () => {
  it('exposes Follow-up Levels and Employee Expenses pages', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const access = readFileSync(resolve(__dirname, '../../../../router/access.ts'), 'utf8')
    const levels = readFileSync(resolve(__dirname, '../FollowUpLevelListPage.vue'), 'utf8')
    const expenses = readFileSync(resolve(__dirname, '../../employee-expenses/EmployeeExpenseListPage.vue'), 'utf8')
    const detail = readFileSync(resolve(__dirname, '../../employee-expenses/EmployeeExpenseDetailPage.vue'), 'utf8')
    const apiLevels = readFileSync(resolve(__dirname, '../../../../api/useFollowUpLevels.ts'), 'utf8')
    const apiExpenses = readFileSync(resolve(__dirname, '../../../../api/useEmployeeExpenses.ts'), 'utf8')

    expect(nav).toContain("name: 'Follow-up Levels'")
    expect(nav).toContain('/accounting/follow-up-levels')
    expect(nav).toContain("name: 'Employee Expenses'")
    expect(nav).toContain('/accounting/employee-expenses')
    expect(router).toContain("path: 'follow-up-levels'")
    expect(router).toContain("path: 'employee-expenses'")
    expect(router).toContain("path: 'expenses-employee'")
    expect(access).toContain('/accounting/follow-up-levels')
    expect(access).toContain('/accounting/employee-expenses')
    expect(sidebar).toContain('sidebar-follow-up-levels')
    expect(sidebar).toContain('sidebar-employee-expenses')
    expect(levels).toContain('New Level')
    expect(expenses).toContain('New Expense')
    expect(detail).toContain('employee-expense-post')
    expect(apiLevels).toContain("resourceName: 'follow-up-levels'")
    expect(apiExpenses).toContain('/employee-expenses/')
    expect(levels).not.toContain('router.push(`')
    expect(expenses).not.toContain('router.push(`')
    expect(detail).not.toContain('router.push(`')
  })
})
