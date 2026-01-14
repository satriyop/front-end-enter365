# API Hooks Pattern

> TanStack Query patterns for Enter365 API integration

## Overview

This project uses **Level 2: Hooks Pattern** - direct TanStack Query hooks returning API types. See [ADR 0003](../architecture/adr/0003-hooks-over-adapters.md) for rationale.

---

## File Structure

```
src/api/
├── client.ts              # Axios instance with interceptors
├── types.ts               # OpenAPI generated types
├── useQuotations.ts       # Quotation hooks
├── useSolarProposals.ts   # Solar proposal hooks
└── ...                    # One file per entity
```

---

## Query Hook Anatomy

### List Query

```typescript
// src/api/useQuotations.ts
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api, type PaginatedResponse } from './client'
import type { Ref } from 'vue'
import { computed } from 'vue'

// Filter interface
export interface QuotationFilters {
  page: number
  per_page: number
  search?: string
  status?: string
  contact_id?: number
}

// Quotation type (matches API response)
export interface Quotation {
  id: number
  quotation_number: string
  contact: {
    id: number
    company_name: string
  }
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  subtotal: number
  tax_amount: number
  grand_total: number
  valid_until: string
  created_at: string
}

// List query hook
export function useQuotations(filters: Ref<QuotationFilters>) {
  return useQuery({
    // CRITICAL: Use computed for reactive query keys
    queryKey: computed(() => ['quotations', filters.value]),

    queryFn: async () => {
      // CRITICAL: Filter out empty parameters
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(
          ([, v]) => v !== '' && v !== undefined && v !== null
        )
      )

      const response = await api.get<PaginatedResponse<Quotation>>(
        '/quotations',
        { params: cleanParams }
      )
      return response.data
    },

    // Cache data for 30 seconds before refetching
    staleTime: 30_000,
  })
}
```

### Single Item Query

```typescript
export function useQuotation(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['quotation', id.value]),

    queryFn: async () => {
      const response = await api.get<{ data: Quotation }>(
        `/quotations/${id.value}`
      )
      return response.data.data
    },

    // CRITICAL: Only fetch when ID is valid
    enabled: computed(() => !!id.value && id.value > 0),
  })
}
```

---

## Mutation Hook Anatomy

### Create

```typescript
export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQuotationData) => {
      const response = await api.post<{ data: Quotation }>(
        '/quotations',
        data
      )
      return response.data.data
    },

    onSuccess: () => {
      // Invalidate list to refetch with new item
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
```

### Update

```typescript
export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateQuotationData }) => {
      const response = await api.put<{ data: Quotation }>(
        `/quotations/${id}`,
        data
      )
      return response.data.data
    },

    onSuccess: (_, { id }) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
    },
  })
}
```

### Delete

```typescript
export function useDeleteQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quotations/${id}`)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
```

### Action (Submit, Approve, etc.)

```typescript
export function useSubmitQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(
        `/quotations/${id}/submit`
      )
      return response.data.data
    },

    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
    },
  })
}
```

---

## Usage in Components

### List Page

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuotations, useDeleteQuotation } from '@/api/useQuotations'
import { useToast } from '@/composables/useToast'
import { getErrorMessage } from '@/api/client'

// Filters (reactive)
const filters = ref({
  page: 1,
  per_page: 10,
  search: '',
  status: '',
})

// Query
const { data, isLoading, error, refetch } = useQuotations(filters)

// Derived state (use computed, not ref)
const quotations = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

// Mutation
const toast = useToast()
const { mutate: deleteQuotation, isPending: isDeleting } = useDeleteQuotation()

function handleDelete(id: number) {
  if (!confirm('Delete this quotation?')) return

  deleteQuotation(id, {
    onSuccess: () => {
      toast.success('Quotation deleted')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}

// Pagination
function changePage(page: number) {
  filters.value.page = page
}
</script>

<template>
  <div>
    <!-- Filters -->
    <FilterBar>
      <Input v-model="filters.search" placeholder="Search..." />
      <Select v-model="filters.status" :options="statusOptions" />
    </FilterBar>

    <!-- Loading -->
    <LoadingSkeleton v-if="isLoading" />

    <!-- Error -->
    <Alert v-else-if="error" variant="destructive">
      {{ getErrorMessage(error) }}
    </Alert>

    <!-- Data -->
    <DataTable v-else :rows="quotations">
      <!-- columns -->
    </DataTable>

    <!-- Pagination -->
    <Pagination
      v-if="pagination"
      :current-page="pagination.current_page"
      :total-pages="pagination.last_page"
      @change="changePage"
    />
  </div>
</template>
```

### Detail Page

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuotation, useSubmitQuotation } from '@/api/useQuotations'

const route = useRoute()
const router = useRouter()

// Get ID from route
const id = computed(() => Number(route.params.id))

// Query
const { data: quotation, isLoading, error } = useQuotation(id)

// Actions
const { mutate: submitQuotation, isPending: isSubmitting } = useSubmitQuotation()

function handleSubmit() {
  submitQuotation(id.value, {
    onSuccess: () => {
      toast.success('Quotation submitted')
    },
  })
}
</script>
```

### Form Page

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateQuotation } from '@/api/useQuotations'

const router = useRouter()

const form = ref({
  contact_id: null,
  valid_until: '',
  notes: '',
  items: [],
})

const { mutate, isPending, error } = useCreateQuotation()

function handleSubmit() {
  mutate(form.value, {
    onSuccess: (data) => {
      router.push(`/quotations/${data.id}`)
    },
  })
}
</script>
```

---

## Critical Patterns

### 1. Always Use Computed Query Keys

```typescript
// CORRECT: Reactive to filter changes
queryKey: computed(() => ['quotations', filters.value])

// WRONG: Won't update when filters change
queryKey: ['quotations', filters.value]
```

### 2. Always Filter Empty Parameters

```typescript
// CORRECT: Empty status won't be sent
const cleanParams = Object.fromEntries(
  Object.entries(filters.value).filter(
    ([, v]) => v !== '' && v !== undefined && v !== null
  )
)

// WRONG: Empty string causes API to filter by ""
api.get('/quotations', { params: filters.value })
```

### 3. Use Enabled for Conditional Queries

```typescript
// CORRECT: Only fetch when ID is valid
enabled: computed(() => !!id.value && id.value > 0)

// WRONG: Fetches with undefined ID
// (no enabled option)
```

### 4. Invalidate Related Queries

```typescript
onSuccess: () => {
  // Primary entity
  queryClient.invalidateQueries({ queryKey: ['quotations'] })

  // Related entities (dashboard stats, etc.)
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}
```

### 5. Use Computed for Derived State

```typescript
// CORRECT: Derived from query data
const quotations = computed(() => data.value?.data ?? [])

// WRONG: Duplicate state that can get out of sync
const quotations = ref([])
watch(data, (d) => { quotations.value = d?.data ?? [] })
```

---

## Common Patterns

### Lookup Query (Autocomplete)

```typescript
export function useContactLookup(search: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ['contacts', 'lookup', search.value]),
    queryFn: async () => {
      if (!search.value || search.value.length < 2) return []
      const response = await api.get('/contacts/lookup', {
        params: { search: search.value }
      })
      return response.data.data
    },
    enabled: computed(() => search.value.length >= 2),
  })
}
```

### Statistics Query

```typescript
export function useQuotationStats() {
  return useQuery({
    queryKey: ['quotation-stats'],
    queryFn: async () => {
      const response = await api.get('/quotations/statistics')
      return response.data.data
    },
    staleTime: 60_000, // Cache for 1 minute
  })
}
```

### Dependent Query

```typescript
// Fetch invoice only after quotation is loaded
export function useInvoiceFromQuotation(quotationId: Ref<number>) {
  const { data: quotation } = useQuotation(quotationId)

  return useQuery({
    queryKey: computed(() => ['invoice', quotation.value?.invoice_id]),
    queryFn: () => api.get(`/invoices/${quotation.value?.invoice_id}`),
    enabled: computed(() => !!quotation.value?.invoice_id),
  })
}
```

---

## Related Documentation

- [MUTATIONS.md](MUTATIONS.md) - Detailed mutation patterns
- [ERROR-HANDLING.md](ERROR-HANDLING.md) - Error handling
- [STATE-MANAGEMENT.md](../architecture/STATE-MANAGEMENT.md) - State patterns
