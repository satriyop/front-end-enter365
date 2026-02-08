# Enter365 API Layer

## Overview

API layer uses TanStack Query (Vue Query) for data fetching, caching, and mutations.

Location: `src/api/`

## Key Files

| File | Purpose |
|------|---------|
| `queryClient.ts` | Query client configuration |
| `queryKeys.ts` | Cache key factory |
| `factory/createCrudHooks.ts` | CRUD hook generator |
| `use*.ts` | 47 module-specific hooks |

## API Hook Inventory (47 hooks)

### Documents & Transactions
| Hook | Module |
|------|--------|
| `useQuotations` | Quotations CRUD + statistics |
| `useInvoices` | Invoices CRUD + statistics |
| `useBills` | Bills CRUD + statistics |
| `usePayments` | Payments CRUD |
| `useDeliveryOrders` | Delivery orders |
| `useDownPayments` | Down payments |
| `useSalesReturns` | Sales returns |
| `usePurchaseOrders` | Purchase orders CRUD |
| `usePurchaseReturns` | Purchase returns |
| `useGoodsReceiptNotes` | GRN CRUD |

### Contacts & Products
| Hook | Module |
|------|--------|
| `useContacts` | Contacts with credit status |
| `useProducts` | Products with low stock |
| `useProductCategories` | Product categories |

### Accounting
| Hook | Module |
|------|--------|
| `useAccounts` | Chart of accounts |
| `useJournalEntries` | Journal entries |
| `useBudgets` | Budgets |
| `useFiscalPeriods` | Fiscal periods |
| `useAccountingPolicies` | Accounting policies |
| `useNsfpRanges` | NSFP range management |
| `useRecurringTemplates` | Recurring templates |
| `useBankTransactions` | Bank transactions |

### Manufacturing
| Hook | Module |
|------|--------|
| `useWorkOrders` | Work orders with actions |
| `useBoms` | Bills of materials |
| `useBomTemplates` | BOM templates |
| `useMaterialRequisitions` | Material requisitions |
| `useSubcontractorWorkOrders` | Subcontractor work orders |
| `useSubcontractorInvoices` | Subcontractor invoices |
| `useMrp` | MRP planning |
| `useComponentStandards` | Component standards |

### Projects & CRM
| Hook | Module |
|------|--------|
| `useProjects` | Projects with progress |
| `useProjectTasks` | Project tasks |
| `useQuotationFollowUp` | Follow-up CRM dashboard |

### Inventory
| Hook | Module |
|------|--------|
| `useInventory` | Inventory management |
| `useStockOpnames` | Stock opnames |
| `useWarehouses` | Warehouse settings |

### Reports & Dashboard
| Hook | Module |
|------|--------|
| `useReports` | 30+ report types |
| `useDashboard` | Dashboard summary + activities |
| `useExports` | CSV/Excel exports |

### Admin & Settings
| Hook | Module |
|------|--------|
| `useUsers` | User management |
| `useRoles` | Role management |
| `useCompanyProfiles` | Company profiles |
| `useSpecRuleSets` | Specification rule sets |

### Utilities
| Hook | Module |
|------|--------|
| `useAttachments` | File attachments |
| `useGlobalSearch` | Global search |
| `usePaymentReminders` | Payment reminders |
| `useSolarProposals` | Solar proposals |
| `usePublicSolarCalculator` | Public solar calculator |

## Query Client Configuration

```typescript
// src/api/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes (garbage collection)
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    mutations: {
      retry: false,
    },
  },
})
```

## Query Keys Factory

### All Modules
```typescript
// src/api/queryKeys.ts
export const queryKeys = {
  contacts:    { all, lists, list, details, detail, lookup },
  products:    { all, lists, list, details, detail, lookup, lowStock },
  quotations:  { all, lists, list, details, detail, statistics },
  invoices:    { all, lists, list, details, detail, statistics },
  bills:       { all, lists, list, details, detail, statistics },
  workOrders:  { all, lists, list, details, detail },
  projects:    { all, lists, list, details, detail, lookup },
  reports:     { profitLoss, balanceSheet, trialBalance, receivableAging, payableAging },
  dashboard:   { summary, recentActivities },
  user:        { all, current, permissions },
}
```

### Filter Types
```typescript
export type BaseFilters = { search?: string; page?: number; per_page?: number }
export type ContactFilters = BaseFilters & { type?: string; is_active?: boolean }
export type ProductFilters = BaseFilters & { category_id?: number; is_active?: boolean }
export type QuotationFilters = BaseFilters & { status?: string; contact_id?: number }
export type InvoiceFilters = BaseFilters & { status?: string; contact_id?: number }
export type BillFilters = BaseFilters & { status?: string; contact_id?: number }
export type WorkOrderFilters = BaseFilters & { status?: string }
export type LookupParams = { search?: string; limit?: number }
```

### Usage Pattern
```typescript
import { queryKeys } from '@/api/queryKeys'

// In queries
useQuery({
  queryKey: computed(() => queryKeys.contacts.list(filters?.value)),
  queryFn: () => fetchContacts(filters?.value),
})

// Invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all })       // All contact queries
queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() })   // All list queries
queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(1) }) // Specific detail
```

## CRUD Hook Factory

### Purpose
Generate consistent CRUD hooks for any resource.

### Usage
```typescript
// src/api/useQuotations.ts
import { createCrudHooks } from './factory/createCrudHooks'

const {
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
  useLookup,
} = createCrudHooks<Quotation, QuotationFormData>({
  resourceName: 'quotations',
  baseUrl: '/quotations',
  queryKeys: queryKeys.quotations,
})

export {
  useList as useQuotations,
  useDetail as useQuotation,
  useCreate as useCreateQuotation,
  useUpdate as useUpdateQuotation,
  useDelete as useDeleteQuotation,
  useLookup as useQuotationLookup,
}
```

## Module-Specific Hook Pattern

### Full Example
```typescript
// src/api/useQuotations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { queryKeys } from './queryKeys'

// List query
export function useQuotations(filters?: Ref<QuotationFilters>) {
  return useQuery({
    queryKey: computed(() => queryKeys.quotations.list(filters?.value)),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Quotation>>('/quotations', {
        params: filters?.value,
      })
      return response.data
    },
  })
}

// Detail query
export function useQuotation(id: Ref<number | string>) {
  return useQuery({
    queryKey: computed(() => queryKeys.quotations.detail(id.value)),
    queryFn: async () => {
      const response = await api.get<Quotation>(`/quotations/${id.value}`)
      return response.data
    },
    enabled: computed(() => !!id.value),
  })
}

// Create mutation
export function useCreateQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: QuotationFormData) => {
      const response = await api.post<Quotation>('/quotations', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() })
    },
  })
}

// Status update
export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await api.patch<Quotation>(`/quotations/${id}/status`, { status })
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() })
    },
  })
}

// Lookup (for select dropdowns)
export function useQuotationLookup(params?: Ref<LookupParams>) {
  return useQuery({
    queryKey: computed(() => queryKeys.quotations.lookup(params?.value)),
    queryFn: async () => {
      const response = await api.get<LookupItem[]>('/quotations/lookup', {
        params: params?.value,
      })
      return response.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes for lookups
  })
}
```

## File Downloads

**IMPORTANT**: Always use blob pattern for authenticated downloads.

```typescript
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      })

      const contentDisposition = response.headers['content-disposition']
      let filename = `invoice-${id}.pdf`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/)
        if (match) filename = match[1]
      }

      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    },
  })
}
```

## Export as Mutation

Use `useMutation` for file exports (action, not data fetching):

```typescript
export function useExportPriceList() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/products-price-list', { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `price-list-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      return true
    },
  })
}
```

## Creating New API Module

### Checklist
1. Add query keys to `queryKeys.ts`
2. Create `use{Module}.ts` with CRUD hooks
3. Use `createCrudHooks` for standard resources
4. Add custom hooks for non-standard operations

### Template
```typescript
// src/api/useMyModule.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api } from './client'
import { queryKeys } from './queryKeys'

// 1. Add to queryKeys.ts first:
// myModule: {
//   all: ['my-module'] as const,
//   lists: () => [...queryKeys.myModule.all, 'list'] as const,
//   list: (filters?) => [...queryKeys.myModule.lists(), filters] as const,
//   details: () => [...queryKeys.myModule.all, 'detail'] as const,
//   detail: (id) => [...queryKeys.myModule.details(), id] as const,
// }

export function useMyModuleList(filters?: Ref<Filters>) {
  return useQuery({
    queryKey: computed(() => queryKeys.myModule.list(filters?.value)),
    queryFn: async () => {
      const response = await api.get('/my-module', { params: filters?.value })
      return response.data
    },
  })
}
```

## Best Practices

1. **Query Keys**: Always use the factory for consistent keys
2. **Invalidation**: Invalidate related queries after mutations
3. **Enabled**: Use `enabled` to prevent queries with invalid IDs
4. **Computed Keys**: Use `computed()` for reactive query keys
5. **Stale Time**: Increase for stable data (lookups, settings)
6. **Error Handling**: Let error boundaries catch query errors
7. **Blob Downloads**: Always use blob for authenticated file downloads
8. **Exports as Mutations**: Use `useMutation` for downloads/exports
