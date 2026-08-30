export const PERMISSION_ROUTE_PREFIXES: Array<{ prefix: string; permission: string }> = [
  { prefix: '/products/new', permission: 'products.create' },
  { prefix: '/inventory/opnames/new', permission: 'stock_opnames.create' },
  { prefix: '/inventory/adjust', permission: 'inventory.adjust' },
  { prefix: '/inventory/transfer', permission: 'inventory.transfer' },
  { prefix: '/accounting/journal-entries/new', permission: 'journals.create' },
  { prefix: '/accounting/journal-entries', permission: 'journals.view' },
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
