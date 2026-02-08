# AI Agent Onboarding Guide

> Essential knowledge for AI agents (Claude, GPT, etc.) to work effectively on this codebase

**Read this first if you are an AI assistant being asked to modify this codebase.**

---

## TL;DR for AI Agents

```
PROJECT TYPE:     Vue 3 SPA (NOT Livewire/Laravel Blade)
BACKEND:          Laravel REST API at /api/v1 (separate repository)
STATE MGMT:       TanStack Query for server data, Pinia for auth only
UI COMPONENTS:    Use @/components/ui/* (Radix Vue + Tailwind)
ICONS:            lucide-vue-next (import { Icon } from 'lucide-vue-next')
STYLING:          Tailwind CSS with semantic tokens (text-muted-foreground, NOT text-gray-500)
API CALLS:        Create hooks in src/api/use*.ts using TanStack Query pattern
FILE DOWNLOADS:   Use blob pattern with auth headers (NOT window.open)
```

---

## Critical Rules

### DO

1. **Use existing UI components** from `@/components/ui/`
2. **Follow the hooks pattern** for API calls (see `src/api/useQuotations.ts`)
3. **Use semantic color tokens** (`text-muted-foreground`, `bg-card`, `border-border`)
4. **Filter empty parameters** before sending to API
5. **Use computed refs** for TanStack Query keys
6. **Invalidate related queries** on mutations

### DO NOT

1. **Do NOT** use native HTML elements (`<button>`, `<input>`, `<select>`)
2. **Do NOT** use hardcoded colors (`bg-white`, `text-slate-500`, `text-red-500`)
3. **Do NOT** use Pinia for server data (only auth state)
4. **Do NOT** use `window.open()` for file downloads (loses auth token)
5. **Do NOT** create new Pinia stores
6. **Do NOT** use `variant="primary"` (removed) - use `variant="default"` or omit
7. **Do NOT** use `variant="danger"` - use `variant="destructive"`

---

## Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                   Enter365 Frontend (Vue 3 SPA)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Route Entry (src/router/index.ts)                            │
│        │                                                        │
│        ▼                                                        │
│   Page Component (src/pages/*)                                  │
│        │                                                        │
│        ├──→ UI Components (src/components/ui/*)                │
│        │         └─→ Button, Input, Select, Card, Badge...    │
│        │                                                        │
│        ├──→ Document Components (src/components/document/*)    │
│        │         └─→ DetailLayout, FormLayout, LineItems...    │
│        │                                                        │
│        ├──→ Feature Components (src/components/*)              │
│        │         └─→ Charts, Maps, Solar, Projects...          │
│        │                                                        │
│        ├──→ Services (src/services/*)                          │
│        │         └─→ Calculation, Pricing, StateMachine...     │
│        │                                                        │
│        └──→ API Hooks (src/api/use*.ts)                        │
│                 │                                               │
│                 └─→ TanStack Query                              │
│                          │                                      │
│                          └─→ Axios (src/api/client.ts)         │
│                                   │                             │
│                                   └─→ Laravel API /api/v1      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│   Infrastructure: DI Container, EventBus, FeatureFlags, Logger │
│   Auth State: Pinia (src/stores/auth.ts) ──→ localStorage      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Common Tasks Reference

### Task: Create a new list page

```typescript
// 1. Read existing pattern from src/pages/quotations/QuotationListPage.vue
// 2. Use this structure:

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useItems, useDeleteItem } from '@/api/useItems'
import { Button, Input, Select, Card, Badge, DataTable, Pagination } from '@/components/ui'
import { FilterBar, FilterGroup } from '@/components/ui'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

// Filters
const filters = ref({
  page: 1,
  per_page: 10,
  search: '',
  status: '',
})

// Query
const { data, isLoading, error } = useItems(filters)
const items = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

// Mutations
const toast = useToast()
const { mutate: deleteItem } = useDeleteItem()
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Items</h1>
        <p class="text-muted-foreground">Manage your items</p>
      </div>
      <Button @click="$router.push('/items/new')">
        <Plus class="w-4 h-4 mr-2" />
        New Item
      </Button>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input v-model="filters.search" placeholder="Search..." />
      </FilterGroup>
      <FilterGroup min-width="150px">
        <Select v-model="filters.status" :options="statusOptions" />
      </FilterGroup>
    </FilterBar>

    <!-- Content -->
    <Card :padding="false">
      <DataTable :data="items" :loading="isLoading" :columns="columns" />
      <Pagination
        v-if="pagination"
        :current-page="pagination.current_page"
        :last-page="pagination.last_page"
        @change="filters.page = $event"
      />
    </Card>
  </div>
</template>
```

### Task: Create an API hook

```typescript
// src/api/useItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import { computed } from 'vue'

export interface ItemFilters {
  page: number
  per_page: number
  search?: string
  status?: string
}

export function useItems(filters: Ref<ItemFilters>) {
  return useQuery({
    // CRITICAL: Use computed for reactive query key
    queryKey: computed(() => ['items', filters.value]),
    queryFn: async () => {
      // CRITICAL: Filter out empty parameters
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(
          ([, v]) => v !== '' && v !== undefined && v !== null
        )
      )
      const response = await api.get('/items', { params: cleanParams })
      return response.data
    },
    staleTime: 30_000,
  })
}

export function useItem(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['item', id.value]),
    queryFn: async () => {
      const response = await api.get(`/items/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateItemInput) => {
      const response = await api.post('/items', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateItemInput }) => {
      const response = await api.put(`/items/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', id] })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/items/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
```

### Task: Add a form with validation

```typescript
<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Button, Input, FormField, Card } from '@/components/ui'
import { useCreateItem } from '@/api/useItems'
import { useToast } from '@/composables/useToast'

// Schema
const schema = toTypedSchema(z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  amount: z.number().positive('Amount must be positive'),
}))

// Form
const { handleSubmit, errors, defineField } = useForm({ validationSchema: schema })
const [name, nameAttrs] = defineField('name')
const [email, emailAttrs] = defineField('email')
const [amount, amountAttrs] = defineField('amount')

// Mutation
const toast = useToast()
const { mutate, isPending } = useCreateItem()

const onSubmit = handleSubmit((values) => {
  mutate(values, {
    onSuccess: () => {
      toast.success('Item created')
      router.push('/items')
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
})
</script>

<template>
  <form @submit="onSubmit">
    <Card>
      <FormField label="Name" :error="errors.name">
        <Input v-model="name" v-bind="nameAttrs" />
      </FormField>

      <FormField label="Email" :error="errors.email">
        <Input v-model="email" v-bind="emailAttrs" type="email" />
      </FormField>

      <FormField label="Amount" :error="errors.amount">
        <CurrencyInput v-model="amount" v-bind="amountAttrs" />
      </FormField>

      <Button type="submit" :disabled="isPending">
        {{ isPending ? 'Saving...' : 'Save' }}
      </Button>
    </Card>
  </form>
</template>
```

### Task: Download a file

```typescript
// CORRECT: Blob download with auth token
import { api } from '@/api/client'

async function downloadFile(url: string, defaultFilename: string) {
  const response = await api.get(url, { responseType: 'blob' })

  // Extract filename from Content-Disposition header
  const contentDisposition = response.headers['content-disposition']
  let filename = defaultFilename
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
}

// Usage
await downloadFile('/reports/export', 'report.xlsx')
```

---

## Module Ownership Quick Lookup

| Route Pattern | Module | Key Files |
|--------------|--------|-----------|
| `/accounting/*` | Accounting | `src/pages/accounting/`, `src/api/useAccounts.ts`, `useJournalEntries.ts`, `useFiscalPeriods.ts` |
| `/solar-proposals/*` | Solar | `src/pages/solar-proposals/`, `src/components/solar/` |
| `/quotations/*` | Sales | `src/pages/quotations/`, `src/api/useQuotations.ts` |
| `/invoices/*` | Sales | `src/pages/invoices/`, `src/api/useInvoices.ts` |
| `/sales/*` | Sales | `src/pages/sales/` (delivery orders, sales returns, follow-up) |
| `/purchasing/*` | Purchasing | `src/pages/purchasing/` (POs, GRNs, purchase returns) |
| `/bills/*` | Purchasing | `src/pages/bills/`, `src/api/useBills.ts` |
| `/payments/*` | Purchasing | `src/pages/payments/`, `src/api/usePayments.ts` |
| `/finance/*` | Finance | `src/pages/finance/` (down payments, reminders) |
| `/boms/*` | Inventory | `src/pages/boms/`, `src/api/useBoms.ts` |
| `/products/*` | Inventory | `src/pages/products/`, `src/api/useProducts.ts` |
| `/inventory/*` | Inventory | `src/pages/inventory/` (stock, opname, transfers) |
| `/contacts/*` | CRM | `src/pages/contacts/`, `src/api/useContacts.ts` |
| `/projects/*` | Projects | `src/pages/projects/`, `src/components/projects/` |
| `/work-orders/*` | Manufacturing | `src/pages/work-orders/`, `src/api/useWorkOrders.ts` |
| `/manufacturing/*` | Manufacturing | `src/pages/manufacturing/` (MR, MRP, subcontracting) |
| `/reports/*` | Finance | `src/pages/reports/` |
| `/settings/*` | Admin | `src/pages/settings/` (roles, warehouses, categories, NSFP) |

---

## File Location Patterns

```
Finding what you need:

API Types?        → src/api/types.ts (auto-generated from OpenAPI)
API Hooks?        → src/api/use{Entity}.ts (47 hook files)
UI Components?    → src/components/ui/{Component}.vue (30 components)
Doc Patterns?     → src/components/document/ (DetailLayout, FormLayout, LineItems)
Page Routes?      → src/router/index.ts
Auth Logic?       → src/stores/auth.ts
Shared Logic?     → src/composables/use{Feature}.ts (22 composables)
Domain Services?  → src/services/{service}/ (calculation, pricing, state-machine)
Infrastructure?   → src/infrastructure/ (container, events, features, logger)
Workflows?        → src/services/state-machine/workflows/
Formatters?       → src/utils/format.ts
Validators?       → src/utils/validation.ts
```

---

## Key ADR Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | Vue 3 Composition API | TypeScript inference, composables |
| Server State | TanStack Query | Auto caching, invalidation, deduplication |
| API Layer | Hooks (no adapters) | Small team, fast iteration, add later if needed |
| UI System | Radix Vue + Tailwind | Full control, accessibility, tree-shakeable |
| Client State | Pinia (auth only) | Clear separation, TanStack handles server data |

See `docs/architecture/adr/` for full decision records.

---

## Common Mistakes to Avoid

### 1. Using reactive ref for query data

```typescript
// WRONG - creates duplicate state
const items = ref([])
watch(data, (d) => { items.value = d?.data ?? [] })

// CORRECT - derive from query
const items = computed(() => data.value?.data ?? [])
```

### 2. Non-reactive query keys

```typescript
// WRONG - won't refetch when filters change
queryKey: ['items', filters.value]

// CORRECT - reactive to filter changes
queryKey: computed(() => ['items', filters.value])
```

### 3. Sending empty parameters

```typescript
// WRONG - sends status=""
api.get('/items', { params: { status: '' } })

// CORRECT - filter empty values
const cleanParams = Object.fromEntries(
  Object.entries(filters.value).filter(
    ([, v]) => v !== '' && v !== undefined && v !== null
  )
)
api.get('/items', { params: cleanParams })
```

### 4. Forgetting to invalidate related queries

```typescript
// WRONG - list won't update
onSuccess: () => {
  // nothing
}

// CORRECT - invalidate related queries
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['items'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}
```

---

## Testing Checklist

Before submitting changes, verify:

- [ ] TypeScript: `npm run type-check` passes
- [ ] Lint: `npm run lint` passes
- [ ] Build: `npm run build` succeeds
- [ ] UI components use design system (not raw HTML)
- [ ] Colors use semantic tokens (not hardcoded)
- [ ] API hooks follow the established pattern
- [ ] Empty filter values are filtered out
- [ ] Related queries are invalidated on mutations

---

## Where to Find More Information

| Topic | Documentation |
|-------|---------------|
| Complete architecture | `docs/architecture/README.md` |
| UI component catalog | `docs/components/UI-COMPONENTS.md` |
| API hooks deep dive | `docs/api/HOOKS-PATTERN.md` |
| Solar domain logic | `docs/domain/SOLAR-PROPOSALS.md` |
| Troubleshooting | `docs/troubleshooting/README.md` |
| File structure | `docs/reference/FILE-STRUCTURE.md` |

---

*This document is optimized for AI agents. For human developers, start with [docs/getting-started/README.md](getting-started/README.md).*
