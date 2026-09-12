export interface ReportLink {
  name: string
  path: string
  description: string
  feature?: string
}

export interface ReportCategory {
  title: string
  description: string
  feature?: string
  reports: ReportLink[]
}

export const reportCategories: ReportCategory[] = [
  {
    title: 'Financial Reports',
    description: 'Balance sheet, income statement, cash flow',
    reports: [
      { name: 'Balance Sheet', path: '/reports/balance-sheet', description: 'Assets, liabilities, and equity' },
      { name: 'Income Statement', path: '/reports/income-statement', description: 'Revenue and expenses' },
      { name: 'Cash Flow', path: '/reports/cash-flow', description: 'Cash movements by activity' },
      { name: 'Trial Balance', path: '/reports/trial-balance', description: 'Account balances summary' },
      { name: 'General Ledger', path: '/reports/general-ledger', description: 'Detailed account transactions' },
      { name: 'Partner Ledger', path: '/reports/partner-ledger', description: 'Partner-grouped journal lines (Buku Besar Partner)' },
      { name: 'Changes in Equity', path: '/reports/changes-in-equity', description: 'Equity movement breakdown' },
      { name: 'Daily Cash Movement', path: '/reports/daily-cash-movement', description: 'Daily receipts and payments' },
      { name: 'Bank Reconciliation', path: '/reports/bank-reconciliation-report', description: 'Bank vs book balance reconciliation', feature: 'bank_reconciliation' },
    ],
  },
  {
    title: 'Period-end Review',
    description: 'Cutover accruals: received not billed, billed not received, delivered not invoiced, invoiced not delivered',
    reports: [
      { name: 'Bill to Receive', path: '/accounting/bill-to-receive', description: 'Goods received, vendor bill not posted' },
      { name: 'Billed Not Received', path: '/accounting/billed-not-received', description: 'Vendor bill posted, goods not received' },
      { name: 'Invoices to Be Issued', path: '/accounting/invoices-to-be-issued', description: 'Goods delivered, customer invoice not posted' },
      { name: 'Invoiced Not Delivered', path: '/accounting/invoiced-not-delivered', description: 'Customer invoice posted, goods not delivered' },
      { name: 'Journal Items', path: '/accounting/journal-items', description: 'Line-level journal item browser' },
      { name: 'Journal Audit', path: '/accounting/journal-audit', description: 'Posted journal register by journal' },
      { name: 'Working Files', path: '/accounting/working-files', description: 'Unposted journals and draft invoices/bills' },
      { name: 'Audit Trail', path: '/accounting/audit-trail', description: 'Accounting document change log' },
      { name: 'Unrealized Currencies', path: '/accounting/unrealized-currencies', description: 'Open FX AR/AP vs closing rate' },
    ],
  },
  {
    title: 'Analysis & Tax',
    description: 'Tax return filing, invoice analysis, analytic, executive, and budget reports',
    reports: [
      { name: 'Tax Returns', path: '/accounting/tax-returns', description: 'Monthly VAT filing workspace' },
      { name: 'Invoice Analysis', path: '/accounting/invoice-analysis', description: 'Posted invoices by month, partner, or status' },
      { name: 'Analytic Report', path: '/accounting/analytic-report', description: 'Income and expense by analytic account' },
      { name: 'Executive Summary', path: '/accounting/executive-summary', description: 'Sales, purchases, AR/AP, and cash KPIs' },
      { name: 'Budget Report', path: '/accounting/budget-report', description: 'Company budgets versus posted actuals' },
    ],
  },
  {
    title: 'Sales Reports',
    description: 'Revenue, customers, and receivables',
    reports: [
      { name: 'Receivables Aging', path: '/reports/receivables-aging', description: 'Outstanding invoices by age' },
      { name: 'Customer Statement', path: '/reports/customer-statement', description: 'Transaction history by customer' },
    ],
  },
  {
    title: 'Purchase Reports',
    description: 'Expenses, vendors, and payables',
    reports: [
      { name: 'Payables Aging', path: '/reports/payables-aging', description: 'Outstanding bills by age' },
      { name: 'Vendor Statement', path: '/reports/vendor-statement', description: 'Transaction history by vendor' },
    ],
  },
  {
    title: 'Inventory Reports',
    description: 'Stock levels and movements',
    feature: 'inventory',
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
      { name: 'PPN Monthly Detail', path: '/reports/ppn-monthly', description: 'Monthly output and input PPN' },
      { name: 'Input Tax List', path: '/reports/input-tax-list', description: 'Vendor tax invoices (Pajak Masukan)' },
      { name: 'Tax Invoice List', path: '/reports/tax-invoice-list', description: 'Output tax invoices (Faktur Pajak)' },
    ],
  },
  {
    title: 'COGS Reports',
    description: 'Cost of goods sold analysis',
    reports: [
      { name: 'COGS Summary', path: '/reports/cogs-summary', description: 'Cost of goods sold overview' },
      { name: 'COGS by Category', path: '/reports/cogs-by-category', description: 'COGS breakdown by product category' },
      { name: 'COGS by Product', path: '/reports/cogs-by-product', description: 'COGS breakdown by individual product' },
      { name: 'COGS Monthly Trend', path: '/reports/cogs-monthly-trend', description: 'Monthly COGS comparison' },
      { name: 'Cost Variance', path: '/reports/cost-variance', description: 'Production cost vs estimate analysis', feature: 'work_orders' },
    ],
  },
  {
    title: 'Project Reports',
    description: 'Project profitability, tasks, and customer ratings',
    feature: 'projects',
    reports: [
      { name: 'Project Profitability', path: '/reports/project-profitability', description: 'Revenue, costs, and margins per project' },
      { name: 'Project Cost Analysis', path: '/reports/project-cost-analysis', description: 'Cost breakdown by type and project' },
      { name: 'Tasks Analysis', path: '/projects/tasks-analysis', description: 'Task status, overdue, and assignee breakdown' },
      { name: 'Customer Ratings', path: '/projects/customer-ratings', description: 'Recorded customer scores on projects and tasks' },
    ],
  },
  {
    title: 'Manufacturing Reports',
    description: 'Work orders and subcontractor analysis',
    reports: [
      { name: 'Work Order Costs', path: '/reports/work-order-costs', description: 'Estimated vs actual work order costs', feature: 'work_orders' },
      { name: 'Subcontractor Summary', path: '/reports/subcontractor-summary', description: 'Subcontractor performance and financials', feature: 'subcontracting' },
      { name: 'Subcontractor Retention', path: '/reports/subcontractor-retention', description: 'Retention held and releasable amounts', feature: 'subcontracting' },
    ],
  },
]
