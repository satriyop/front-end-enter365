import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('analytic dimensions (#147)', () => {
  it('exposes plans, distribution models, items, and analytic budgets', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const router = readFileSync(resolve(__dirname, '../../../../router/index.ts'), 'utf8')
    const sidebar = readFileSync(resolve(__dirname, '../../../../layouts/AppSidebar.vue'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../../api/useAnalyticDimensions.ts'), 'utf8')
    const plans = readFileSync(resolve(__dirname, '../AnalyticPlanListPage.vue'), 'utf8')
    const models = readFileSync(resolve(__dirname, '../../analytic-distribution-models/AnalyticDistributionModelListPage.vue'), 'utf8')
    const items = readFileSync(resolve(__dirname, '../../analytic-items/AnalyticItemListPage.vue'), 'utf8')
    const budgets = readFileSync(resolve(__dirname, '../../analytic-budgets/AnalyticBudgetListPage.vue'), 'utf8')
    const form = readFileSync(resolve(__dirname, '../AnalyticPlanFormPage.vue'), 'utf8')

    expect(nav).toContain("name: 'Analytic Plans'")
    expect(nav).toContain('/accounting/analytic-plans')
    expect(nav).toContain("name: 'Analytic Distribution Models'")
    expect(nav).toContain('/accounting/analytic-distribution-models')
    expect(nav).toContain("name: 'Analytic Items'")
    expect(nav).toContain('/accounting/analytic-items')
    expect(nav).toContain("name: 'Analytic Budgets'")
    expect(nav).toContain('/accounting/analytic-budgets')
    expect(router).toContain("path: 'analytic-plans'")
    expect(router).toContain("path: 'analytic-distribution-models'")
    expect(router).toContain("path: 'analytic-items'")
    expect(router).toContain("path: 'analytic-budgets'")
    expect(sidebar).toContain('sidebar-analytic-plans')
    expect(sidebar).toContain('sidebar-analytic-items')
    expect(plans).toContain('New Analytic Plan')
    expect(models).toContain('New Distribution Model')
    expect(items).toContain('Analytic Items')
    expect(budgets).toContain('New Analytic Budget')
    expect(api).toContain('/analytic-items')
    expect(api).toContain('useCreateAnalyticPlan')
    expect(form).not.toContain('router.push(`')
  })
})
