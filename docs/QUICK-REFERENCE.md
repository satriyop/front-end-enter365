# Quick Reference Card

> One-page cheat sheet for daily development

---

## Commands

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run type-check   # TypeScript check
npm run lint         # ESLint fix
npm run test         # Run tests
npm run types:generate  # Regenerate API types
```

---

## Import Cheat Sheet

```typescript
// UI Components
import { Button, Input, Select, Card, Badge, Modal } from '@/components/ui'
import { FilterBar, FilterGroup } from '@/components/ui'
import { DataTable, Pagination, EmptyState } from '@/components/ui'

// Icons
import { Plus, Edit, Trash2, ChevronDown, Search } from 'lucide-vue-next'

// Vue
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

// TanStack Query
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// API
import { api, getErrorMessage } from '@/api/client'

// Composables
import { useToast } from '@/composables/useToast'

// Utilities
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'
```

---

## Component Quick Reference

### Button

```vue
<Button>Default (Orange)</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Minimal</Button>
<Button variant="success">Confirm</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Plus class="w-4 h-4" /></Button>
<Button :disabled="isPending">{{ isPending ? 'Saving...' : 'Save' }}</Button>
```

### Input

```vue
<Input v-model="search" placeholder="Search..." />
<Input v-model="email" type="email" />
<Input v-model="amount" type="number" />
```

### Select

```vue
<Select v-model="status" :options="[
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
]" />
```

### Badge

```vue
<Badge>Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge status="draft">Draft</Badge>
<Badge status="approved">Approved</Badge>
```

### Modal

```vue
<Modal v-model:open="isOpen" title="Confirm Delete" size="sm">
  <p>Are you sure?</p>
  <template #footer>
    <Button variant="outline" @click="isOpen = false">Cancel</Button>
    <Button variant="destructive" @click="handleDelete">Delete</Button>
  </template>
</Modal>
```

### Card

```vue
<Card>Content with padding</Card>
<Card :padding="false">Content without padding (for tables)</Card>
<Card title="Section Title">Content</Card>
```

---

## Page Template

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useItems, useDeleteItem } from '@/api/useItems'
import { Button, Input, Select, Card, DataTable, Pagination } from '@/components/ui'
import { FilterBar, FilterGroup } from '@/components/ui'
import { Plus } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const filters = ref({ page: 1, per_page: 10, search: '', status: '' })
const { data, isLoading } = useItems(filters)
const items = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Items</h1>
        <p class="text-muted-foreground">Manage items</p>
      </div>
      <Button @click="$router.push('/items/new')">
        <Plus class="w-4 h-4 mr-2" /> New Item
      </Button>
    </div>

    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input v-model="filters.search" placeholder="Search..." />
      </FilterGroup>
      <FilterGroup min-width="150px">
        <Select v-model="filters.status" :options="statusOptions" />
      </FilterGroup>
    </FilterBar>

    <Card :padding="false">
      <DataTable :data="items" :loading="isLoading" />
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

---

## API Hook Template

```typescript
// src/api/useItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { computed, type Ref } from 'vue'

export function useItems(filters: Ref<ItemFilters>) {
  return useQuery({
    queryKey: computed(() => ['items', filters.value]),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v != null)
      )
      return (await api.get('/items', { params })).data
    },
    staleTime: 30_000,
  })
}

export function useItem(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['item', id.value]),
    queryFn: async () => (await api.get(`/items/${id.value}`)).data.data,
    enabled: computed(() => id.value > 0),
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateItemInput) =>
      (await api.post('/items', data)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}
```

---

## Color Tokens

| Use This | NOT This |
|----------|----------|
| `text-muted-foreground` | `text-gray-500` |
| `bg-card` | `bg-white` |
| `border-border` | `border-gray-200` |
| `bg-primary` | `bg-orange-500` |
| `text-destructive` | `text-red-500` |
| `bg-accent` | `bg-gray-100` |

---

## Formatting Utils

```typescript
import { formatCurrency, formatDate, formatNumber, formatPercent } from '@/utils/format'

formatCurrency(1500000)       // "Rp 1.500.000"
formatDate('2024-01-15')      // "15 Jan 2024"
formatNumber(1234567)         // "1.234.567"
formatPercent(0.85)           // "85%"
```

---

## Common Patterns

### Loading/Error States

```vue
<LoadingSkeleton v-if="isLoading" />
<Alert v-else-if="error" variant="destructive">{{ getErrorMessage(error) }}</Alert>
<DataTable v-else :data="items" />
```

### Toast Notifications

```typescript
const toast = useToast()
toast.success('Item created')
toast.error('Failed to delete')
toast.info('Processing...')
```

### Mutation with Feedback

```typescript
const { mutate, isPending } = useCreateItem()

mutate(data, {
  onSuccess: () => {
    toast.success('Created!')
    router.push('/items')
  },
  onError: (error) => {
    toast.error(getErrorMessage(error))
  },
})
```

### File Download

```typescript
const response = await api.get('/export', { responseType: 'blob' })
const url = URL.createObjectURL(new Blob([response.data]))
const link = document.createElement('a')
link.href = url
link.download = 'file.xlsx'
link.click()
URL.revokeObjectURL(url)
```

---

## File Locations

```
API hooks         → src/api/use{Entity}.ts
UI components     → src/components/ui/
Domain components → src/components/{domain}/
Pages             → src/pages/{domain}/
Composables       → src/composables/use{Feature}.ts
Routes            → src/router/index.ts
Formatters        → src/utils/format.ts
API types         → src/api/types.ts (auto-generated)
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Command palette |
| `Cmd+S` | Save (in forms) |
| `Escape` | Close modal |

---

*Print this page and keep it at your desk!*
