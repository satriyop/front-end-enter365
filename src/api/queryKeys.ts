/**
 * Query Keys Factory
 *
 * Centralized query key management for TanStack Query.
 * Ensures consistent cache keys across the application.
 *
 * @example
 * ```typescript
 * // Use in queries
 * useQuery({
 *   queryKey: queryKeys.contacts.list({ type: 'customer' }),
 *   queryFn: () => fetchContacts({ type: 'customer' }),
 * })
 *
 * // Use in invalidations
 * queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })
 * ```
 */

// Type helpers for filters
interface BaseFilters {
  search?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

interface ContactFilters extends BaseFilters {
  type?: 'customer' | 'vendor' | 'both'
  is_active?: boolean
}

interface ProductFilters extends BaseFilters {
  category_id?: number
  type?: 'product' | 'service'
  is_active?: boolean
  low_stock?: boolean
}

interface QuotationFilters extends BaseFilters {
  status?: string
  contact_id?: number
  date_from?: string
  date_to?: string
}

interface InvoiceFilters extends BaseFilters {
  status?: string
  contact_id?: number
  date_from?: string
  date_to?: string
  overdue?: boolean
}

interface BillFilters extends BaseFilters {
  status?: string
  contact_id?: number
  date_from?: string
  date_to?: string
}

interface WorkOrderFilters extends BaseFilters {
  status?: string
  project_id?: number
}

interface LookupParams {
  search?: string
  limit?: number
}

/**
 * Query keys factory
 */
export const queryKeys = {
  // ─────────────────────────────────────────────────────────────────
  // Contacts
  // ─────────────────────────────────────────────────────────────────
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters?: ContactFilters) => [...queryKeys.contacts.lists(), filters] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.contacts.details(), id] as const,
    lookup: (params?: LookupParams) => [...queryKeys.contacts.all, 'lookup', params] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // Products
  // ─────────────────────────────────────────────────────────────────
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters?: ProductFilters) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.products.details(), id] as const,
    lookup: (params?: LookupParams) => [...queryKeys.products.all, 'lookup', params] as const,
    lowStock: () => [...queryKeys.products.all, 'low-stock'] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // Quotations
  // ─────────────────────────────────────────────────────────────────
  quotations: {
    all: ['quotations'] as const,
    lists: () => [...queryKeys.quotations.all, 'list'] as const,
    list: (filters?: QuotationFilters) => [...queryKeys.quotations.lists(), filters] as const,
    details: () => [...queryKeys.quotations.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.quotations.details(), id] as const,
    statistics: () => [...queryKeys.quotations.all, 'statistics'] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // Invoices
  // ─────────────────────────────────────────────────────────────────
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters?: InvoiceFilters) => [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.invoices.details(), id] as const,
    statistics: () => [...queryKeys.invoices.all, 'statistics'] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // Bills
  // ─────────────────────────────────────────────────────────────────
  bills: {
    all: ['bills'] as const,
    lists: () => [...queryKeys.bills.all, 'list'] as const,
    list: (filters?: BillFilters) => [...queryKeys.bills.lists(), filters] as const,
    details: () => [...queryKeys.bills.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.bills.details(), id] as const,
    statistics: () => [...queryKeys.bills.all, 'statistics'] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // Work Orders
  // ─────────────────────────────────────────────────────────────────
  workOrders: {
    all: ['work-orders'] as const,
    lists: () => [...queryKeys.workOrders.all, 'list'] as const,
    list: (filters?: WorkOrderFilters) => [...queryKeys.workOrders.lists(), filters] as const,
    details: () => [...queryKeys.workOrders.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.workOrders.details(), id] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // Projects
  // ─────────────────────────────────────────────────────────────────
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters?: BaseFilters) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.projects.details(), id] as const,
    lookup: (params?: LookupParams) => [...queryKeys.projects.all, 'lookup', params] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // Reports
  // ─────────────────────────────────────────────────────────────────
  reports: {
    all: ['reports'] as const,
    profitLoss: (params?: { from?: string; to?: string }) =>
      [...queryKeys.reports.all, 'profit-loss', params] as const,
    balanceSheet: (params?: { date?: string }) =>
      [...queryKeys.reports.all, 'balance-sheet', params] as const,
    trialBalance: (params?: { from?: string; to?: string }) =>
      [...queryKeys.reports.all, 'trial-balance', params] as const,
    receivableAging: () => [...queryKeys.reports.all, 'receivable-aging'] as const,
    payableAging: () => [...queryKeys.reports.all, 'payable-aging'] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // Dashboard
  // ─────────────────────────────────────────────────────────────────
  dashboard: {
    all: ['dashboard'] as const,
    summary: () => [...queryKeys.dashboard.all, 'summary'] as const,
    recentActivities: () => [...queryKeys.dashboard.all, 'recent-activities'] as const,
  },

  // ─────────────────────────────────────────────────────────────────
  // User / Auth
  // ─────────────────────────────────────────────────────────────────
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    permissions: () => [...queryKeys.user.all, 'permissions'] as const,
  },
} as const

// Export filter types for use in API hooks
export type {
  BaseFilters,
  ContactFilters,
  ProductFilters,
  QuotationFilters,
  InvoiceFilters,
  BillFilters,
  WorkOrderFilters,
  LookupParams,
}
