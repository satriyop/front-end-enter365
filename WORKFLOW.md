# Enter365 Frontend - Development Workflow

## Architecture Pattern

### Level 2 Hooks Pattern
```
src/
├── api/           # API hooks (TanStack Query) + types
├── components/ui/ # Reusable UI components
├── composables/   # Shared Vue composables
├── layouts/       # App layout (sidebar, header)
├── pages/         # Route pages organized by module
├── stores/        # Pinia stores (auth only)
├── utils/         # Formatters, helpers
└── router/        # Vue Router config
```

---

## Adding a New Module

### 1. Create API Hook (`src/api/use{Entity}.ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'

// Types
export interface Entity { id: number; name: string; /* ... */ }
export interface EntityFilters { page?: number; search?: string; /* ... */ }

// List query - ALWAYS filter empty params
export function useEntities(filters: Ref<EntityFilters>) {
  return useQuery({
    queryKey: computed(() => ['entities', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<Entity>>('/entities', { params: cleanParams })
      return response.data
    },
  })
}

// Single query
export function useEntity(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['entity', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: Entity }>(`/entities/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

// Mutations
export function useCreateEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Entity>) => {
      const response = await api.post<{ data: Entity }>('/entities', data)
      return response.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entities'] }),
  })
}
```

### 2. Create Pages (`src/pages/{module}/`)

- `{Entity}ListPage.vue` - List with filters, search, pagination
- `{Entity}DetailPage.vue` - View single record with actions
- `{Entity}FormPage.vue` - Create/Edit form (shared)

### 3. Add Routes (`src/router/index.ts`)

```typescript
{
  path: 'entities',
  name: 'entities',
  component: () => import('@/pages/entities/EntityListPage.vue')
},
{
  path: 'entities/new',
  name: 'entity-new',
  component: () => import('@/pages/entities/EntityFormPage.vue')
},
{
  path: 'entities/:id',
  name: 'entity-detail',
  component: () => import('@/pages/entities/EntityDetailPage.vue')
},
{
  path: 'entities/:id/edit',
  name: 'entity-edit',
  component: () => import('@/pages/entities/EntityFormPage.vue')
},
```

### 4. Update Sidebar (`src/layouts/AppSidebar.vue`)

Add navigation item with permission check.

---

## Common Patterns

### Filter Parameters
**Always** filter out empty values before sending to API:
```typescript
const cleanParams = Object.fromEntries(
  Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
)
```

### Toast Notifications
```typescript
import { useToast } from '@/components/ui'
const toast = useToast()

toast.success('Record saved')
toast.error('Failed to save')
```

### Currency Formatting
```typescript
import { formatCurrency } from '@/utils/format'
formatCurrency(1500000) // "Rp 1.500.000"
```

### Status Badges
```vue
<Badge :status="record.status" />
```
Automatically maps status to color (draft=gray, approved=green, etc.)

### Modal Pattern
```vue
<Modal :open="showModal" title="Title" @update:open="showModal = $event">
  <!-- Content -->
  <template #footer>
    <Button variant="ghost" @click="showModal = false">Cancel</Button>
    <Button variant="primary" @click="handleSave">Save</Button>
  </template>
</Modal>
```

---

## Commands

```bash
# Development
npm run dev

# Type check
npm run type-check

# Build
npm run build

# Preview build
npm run preview
```

---

## Backend API Base URL

Configured in `.env`:
```
VITE_API_BASE_URL=http://enter365.test/api/v1
```

---

## Key Files Reference

| Purpose | File |
|---------|------|
| API client | `src/api/client.ts` |
| OpenAPI types | `src/api/types.ts` |
| Auth store | `src/stores/auth.ts` |
| Router | `src/router/index.ts` |
| Layout | `src/layouts/AppLayout.vue` |
| Sidebar | `src/layouts/AppSidebar.vue` |
| Formatters | `src/utils/format.ts` |
