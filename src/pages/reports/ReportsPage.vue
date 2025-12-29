<script setup lang="ts">
import { Card } from '@/components/ui'

const reportCategories = [
  {
    title: 'Financial Reports',
    description: 'Balance sheet, income statement, cash flow',
    reports: [
      { name: 'Balance Sheet', path: '/reports/balance-sheet', description: 'Assets, liabilities, and equity' },
      { name: 'Income Statement', path: '/reports/income-statement', description: 'Revenue and expenses' },
      { name: 'Cash Flow', path: '/reports/cash-flow', description: 'Cash movements by activity' },
      { name: 'Trial Balance', path: '/reports/trial-balance', description: 'Account balances summary' },
    ],
  },
  {
    title: 'Sales Reports',
    description: 'Revenue, customers, and receivables',
    reports: [
      { name: 'Sales Summary', path: '/reports/sales-summary', description: 'Sales by period and customer' },
      { name: 'Receivables Aging', path: '/reports/receivables-aging', description: 'Outstanding invoices by age' },
      { name: 'Customer Statement', path: '/reports/customer-statement', description: 'Transaction history by customer' },
    ],
  },
  {
    title: 'Purchase Reports',
    description: 'Expenses, vendors, and payables',
    reports: [
      { name: 'Purchase Summary', path: '/reports/purchase-summary', description: 'Purchases by period and vendor' },
      { name: 'Payables Aging', path: '/reports/payables-aging', description: 'Outstanding bills by age' },
      { name: 'Vendor Statement', path: '/reports/vendor-statement', description: 'Transaction history by vendor' },
    ],
  },
  {
    title: 'Inventory Reports',
    description: 'Stock levels and movements',
    reports: [
      { name: 'Stock Summary', path: '/reports/stock-summary', description: 'Current stock by warehouse' },
      { name: 'Stock Movement', path: '/reports/stock-movement', description: 'Inventory transactions' },
      { name: 'Stock Valuation', path: '/reports/stock-valuation', description: 'Inventory value by product' },
    ],
  },
  {
    title: 'Tax Reports',
    description: 'VAT and tax compliance',
    reports: [
      { name: 'VAT Report', path: '/reports/vat', description: 'Input and output VAT summary' },
      { name: 'Tax Summary', path: '/reports/tax-summary', description: 'Taxes collected and paid' },
    ],
  },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reports</h1>
      <p class="text-slate-500 dark:text-slate-400">Generate financial and operational reports</p>
    </div>

    <div class="space-y-8">
      <div v-for="category in reportCategories" :key="category.title">
        <h2 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">{{ category.title }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RouterLink
            v-for="report in category.reports"
            :key="report.path"
            :to="report.path"
            class="block"
          >
            <Card class="h-full hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-sm transition-all cursor-pointer">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 class="font-medium text-slate-900 dark:text-slate-100">{{ report.name }}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">{{ report.description }}</p>
                </div>
              </div>
            </Card>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
