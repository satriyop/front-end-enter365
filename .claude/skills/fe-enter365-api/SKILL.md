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
| `use*.ts` | Module-specific hooks |

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

### Purpose
Consistent cache keys for proper cache invalidation.

### Pattern
```typescript
// src/api/queryKeys.ts
export const queryKeys = {
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters?: ContactFilters) => [...queryKeys.contacts.lists(), filters] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: number | string) => [...queryKeys.contacts.details(), id] as const,
    lookup: (params?: LookupParams) => [...queryKeys.contacts.all, 'lookup', params] as const,
  },
  // ... other modules
}
```

### Usage
```typescript
import { queryKeys } from '@/api/queryKeys'

// In queries
useQuery({
  queryKey: queryKeys.contacts.list({ type: 'customer' }),
  queryFn: () => fetchContacts({ type: 'customer' }),
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
import type { Quotation, QuotationFormData } from '@/types'

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

## Module-Specific Hooks

### Structure
```typescript
// src/api/useQuotations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { queryKeys } from './queryKeys'
import type { Quotation, QuotationFormData, PaginatedResponse } from '@/types'

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

// Update mutation
export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<QuotationFormData>) => {
      const response = await api.patch<Quotation>(`/quotations/${id}`, data)
      return response.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() })
    },
  })
}

// Delete mutation
export function useDeleteQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quotations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all })
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

## Usage in Components

### List Page
```typescript
<script setup lang="ts">
import { ref } from 'vue'
import { useQuotations } from '@/api/useQuotations'

const filters = ref({
  search: '',
  status: '',
  page: 1,
})

const { data, isLoading, error, refetch } = useQuotations(filters)
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <QuotationTable :items="data.data" />
    <Pagination
      :current-page="data.current_page"
      :total="data.total"
      @change="(page) => filters.page = page"
    />
  </div>
</template>
```

### Form Page
```typescript
<script setup lang="ts">
import { useQuotation, useUpdateQuotation } from '@/api/useQuotations'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)

const { data: quotation, isLoading } = useQuotation(id)
const updateMutation = useUpdateQuotation()

async function handleSubmit(formData: QuotationFormData) {
  await updateMutation.mutateAsync({ id: Number(id.value), ...formData })
  router.push({ name: 'quotation-detail', params: { id: id.value } })
}
</script>
```

## Optimistic Updates

```typescript
export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const response = await api.patch(`/quotations/${id}`, data)
      return response.data
    },

    // Optimistic update
    onMutate: async ({ id, ...data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.quotations.detail(id) })

      // Snapshot previous value
      const previous = queryClient.getQueryData(queryKeys.quotations.detail(id))

      // Optimistically update
      queryClient.setQueryData(queryKeys.quotations.detail(id), (old: Quotation) => ({
        ...old,
        ...data,
      }))

      return { previous }
    },

    // Rollback on error
    onError: (err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.quotations.detail(id), context.previous)
      }
    },

    // Always refetch after error or success
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quotations.detail(id) })
    },
  })
}
```

## Prefetching

```typescript
import { useQueryClient } from '@tanstack/vue-query'

// Prefetch on hover
function usePrefetchQuotation() {
  const queryClient = useQueryClient()

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.quotations.detail(id),
      queryFn: () => api.get(`/quotations/${id}`).then(r => r.data),
      staleTime: 60 * 1000, // Consider fresh for 1 minute
    })
  }
}

// Usage
const prefetch = usePrefetchQuotation()

<tr
  v-for="quotation in quotations"
  @mouseenter="prefetch(quotation.id)"
>
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

      // Extract filename from header
      const contentDisposition = response.headers['content-disposition']
      let filename = `invoice-${id}.pdf`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";\n]+)"?/)
        if (match) filename = match[1]
      }

      // Trigger download
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

## Creating New API Module

### Template
```typescript
// src/api/useMyModule.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api } from './client'
import { queryKeys } from './queryKeys'
import type { MyEntity, MyEntityFormData } from '@/types'

// 1. Add to queryKeys.ts
// myModule: {
//   all: ['my-module'] as const,
//   lists: () => [...queryKeys.myModule.all, 'list'] as const,
//   ...
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

export function useMyModuleDetail(id: Ref<number | string>) {
  return useQuery({
    queryKey: computed(() => queryKeys.myModule.detail(id.value)),
    queryFn: async () => {
      const response = await api.get(`/my-module/${id.value}`)
      return response.data
    },
    enabled: computed(() => !!id.value),
  })
}

export function useCreateMyModule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: MyEntityFormData) => {
      const response = await api.post('/my-module', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myModule.lists() })
    },
  })
}

// ... update, delete mutations
```

## Best Practices

1. **Query Keys**: Always use the factory for consistent keys
2. **Invalidation**: Invalidate related queries after mutations
3. **Enabled**: Use `enabled` to prevent queries with invalid IDs
4. **Computed Keys**: Use `computed()` for reactive query keys
5. **Stale Time**: Increase for stable data (lookups, settings)
6. **Error Handling**: Let error boundaries catch query errors
7. **Blob Downloads**: Always use blob for authenticated file downloads
