export const PERMISSION_ROUTE_PREFIXES: Array<{ prefix: string; permission: string }> = [
  { prefix: '/products/new', permission: 'products.create' },
  { prefix: '/inventory/opnames/new', permission: 'stock_opnames.create' },
  { prefix: '/inventory/adjust', permission: 'inventory.adjust' },
  { prefix: '/inventory/transfer', permission: 'inventory.transfer' },
  { prefix: '/accounting/journals/new', permission: 'journals.create' },
  { prefix: '/accounting/journals', permission: 'journals.view' },
  { prefix: '/accounting/analytic-accounts/new', permission: 'journals.create' },
  { prefix: '/accounting/analytic-accounts', permission: 'journals.view' },
  { prefix: '/accounting/analytic-plans/new', permission: 'journals.create' },
  { prefix: '/accounting/analytic-plans', permission: 'journals.view' },
  { prefix: '/accounting/analytic-distribution-models/new', permission: 'journals.create' },
  { prefix: '/accounting/analytic-distribution-models', permission: 'journals.view' },
  { prefix: '/accounting/analytic-items', permission: 'journals.view' },
  { prefix: '/accounting/analytic-budgets/new', permission: 'journals.create' },
  { prefix: '/accounting/analytic-budgets', permission: 'journals.view' },
  { prefix: '/accounting/tax-tags/new', permission: 'journals.create' },
  { prefix: '/accounting/tax-tags', permission: 'journals.view' },
  { prefix: '/accounting/journal-entries/new', permission: 'journals.create' },
  { prefix: '/accounting/journal-entries', permission: 'journals.view' },
  { prefix: '/accounting/transfers/new', permission: 'journals.create' },
  { prefix: '/accounting/transfers', permission: 'journals.view' },
  { prefix: '/accounting/reconcile', permission: 'journals.view' },
  { prefix: '/accounting/bill-to-receive', permission: 'reports.financial' },
  { prefix: '/accounting/billed-not-received', permission: 'reports.financial' },
  { prefix: '/accounting/invoices-to-be-issued', permission: 'reports.financial' },
  { prefix: '/accounting/invoiced-not-delivered', permission: 'reports.financial' },
  { prefix: '/reports/stock-summary', permission: 'inventory.view' },
  { prefix: '/reports/stock-movement', permission: 'inventory.view' },
  { prefix: '/reports/stock-valuation', permission: 'inventory.view' },
  { prefix: '/reports', permission: 'reports.financial' },
  { prefix: '/finance/reminders', permission: 'invoices.view' },
].sort((a, b) => b.prefix.length - a.prefix.length)

export function requiredPermissionForPath(path: string): string | null {
  const match = PERMISSION_ROUTE_PREFIXES.find(
    ({ prefix }) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix),
  )
  return match?.permission ?? null
}

export function canOpenPath(
  path: string,
  hasPermission: (name: string) => boolean,
): boolean {
  const permission = requiredPermissionForPath(path)
  if (!permission) {
    return true
  }
  return hasPermission(permission)
}
