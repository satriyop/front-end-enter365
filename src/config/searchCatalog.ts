export interface SearchCatalogItem {
  type: 'action' | 'nav'
  label: string
  icon: string
  path: string
  feature?: string
}

export const SEARCH_QUICK_ACTIONS: SearchCatalogItem[] = [
  { type: 'action', label: 'New Quotation', icon: '📝', path: '/quotations/new', feature: 'quotations' },
  { type: 'action', label: 'New Invoice', icon: '📄', path: '/invoices/new', feature: 'invoices' },
  { type: 'action', label: 'New Contact', icon: '👤', path: '/contacts/new' },
  { type: 'action', label: 'New Project', icon: '🏗️', path: '/projects/new', feature: 'projects' },
  { type: 'action', label: 'New Work Order', icon: '🔧', path: '/work-orders/new', feature: 'work_orders' },
  { type: 'action', label: 'New Purchase Order', icon: '🛒', path: '/purchasing/purchase-orders/new', feature: 'purchase_orders' },
]

export const SEARCH_NAV_ITEMS: SearchCatalogItem[] = [
  { type: 'nav', label: 'Dashboard', icon: '🏠', path: '/' },
  { type: 'nav', label: 'Quotations', icon: '📝', path: '/quotations', feature: 'quotations' },
  { type: 'nav', label: 'Invoices', icon: '📄', path: '/invoices', feature: 'invoices' },
  { type: 'nav', label: 'Bills', icon: '📋', path: '/bills' },
  { type: 'nav', label: 'Contacts', icon: '👤', path: '/contacts' },
  { type: 'nav', label: 'Products', icon: '📦', path: '/products' },
  { type: 'nav', label: 'Projects', icon: '🏗️', path: '/projects', feature: 'projects' },
  { type: 'nav', label: 'My Tasks', icon: '✅', path: '/projects/my-tasks', feature: 'projects' },
  { type: 'nav', label: 'All Tasks', icon: '📋', path: '/projects/tasks', feature: 'projects' },
  { type: 'nav', label: 'Tasks Analysis', icon: '📊', path: '/projects/tasks-analysis', feature: 'projects' },
  { type: 'nav', label: 'Customer Ratings', icon: '⭐', path: '/projects/customer-ratings', feature: 'projects' },
  { type: 'nav', label: 'Work Orders', icon: '🔧', path: '/work-orders', feature: 'work_orders' },
  { type: 'nav', label: 'Inventory', icon: '📊', path: '/inventory', feature: 'inventory' },
  { type: 'nav', label: 'Reports', icon: '📈', path: '/reports' },
  { type: 'nav', label: 'Purchase Orders', icon: '🛒', path: '/purchasing/purchase-orders', feature: 'purchase_orders' },
]

export const SEARCH_RESULT_FEATURES: Record<string, string> = {
  invoice: 'invoices',
  quotation: 'quotations',
  bom: 'bom',
  project: 'projects',
  solar_proposal: 'solar_proposals',
}

export function catalogVisible(
  items: SearchCatalogItem[],
  enabled: (feature: string) => boolean,
): SearchCatalogItem[] {
  return items.filter((item) => !item.feature || enabled(item.feature))
}

export function searchResultVisible(
  type: string,
  enabled: (feature: string) => boolean,
): boolean {
  const feature = SEARCH_RESULT_FEATURES[type]
  return !feature || enabled(feature)
}

export function isPosAcquisitionPreset(preset: string | undefined | null): boolean {
  return preset === 'pos' || preset === 'parity'
}
