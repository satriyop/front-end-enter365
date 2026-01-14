# Getting Started

> 5-minute quickstart for Enter365 frontend development

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Node.js | 18+ | `node -v` |
| npm | 9+ | `npm -v` |
| Git | 2.x | `git --version` |

---

## Quick Start

### 1. Clone and Install

```bash
# Clone repository
git clone <repo-url> front-end-enter365
cd front-end-enter365

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173

---

## Project Structure (Key Files)

```
src/
├── api/
│   ├── client.ts           # Axios with auth interceptors
│   └── use*.ts             # TanStack Query hooks
├── components/ui/          # Design system components
├── pages/                  # Route components
├── stores/auth.ts          # Pinia auth store
├── router/index.ts         # Vue Router config
└── utils/format.ts         # Formatters (currency, date)
```

---

## Common Tasks

### Create a New Page

1. Create page component in `src/pages/[module]/`:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuotations } from '@/api/useQuotations'
import { Button, Card, DataTable } from '@/components/ui'

const filters = ref({ page: 1, per_page: 10 })
const { data, isLoading } = useQuotations(filters)
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold mb-6">Page Title</h1>
    <Card :padding="false">
      <DataTable :rows="data?.data ?? []" :loading="isLoading" />
    </Card>
  </div>
</template>
```

2. Add route in `src/router/index.ts`:
```typescript
{
  path: 'new-page',
  name: 'new-page',
  component: () => import('@/pages/module/NewPage.vue'),
  meta: { breadcrumb: 'New Page' }
}
```

### Create an API Hook

```typescript
// src/api/useNewEntity.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'

interface Entity {
  id: number
  name: string
}

export function useEntities(filters: Ref<{ page: number }>) {
  return useQuery({
    queryKey: computed(() => ['entities', filters.value]),
    queryFn: async () => {
      const response = await api.get('/entities', { params: filters.value })
      return response.data
    },
  })
}

export function useCreateEntity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Entity>) => api.post('/entities', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entities'] }),
  })
}
```

### Use UI Components

```vue
<script setup lang="ts">
import { Button, Input, Select, Card, Badge, Modal } from '@/components/ui'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
</script>

<template>
  <Button variant="default">
    <Plus class="w-4 h-4 mr-2" />
    Create
  </Button>

  <Badge status="approved">Approved</Badge>

  <Select v-model="status" :options="statusOptions" />
</template>
```

---

## Development Workflow

```
1. Create/modify API hook (src/api/)
2. Create/modify page component (src/pages/)
3. Run type check: npm run type-check
4. Test in browser: npm run dev
5. Run tests: npm run test
```

---

## Next Steps

- [Full Onboarding Guide](ONBOARDING.md) - IDE setup, extensions, conventions
- [Environment Configuration](ENVIRONMENTS.md) - All environment variables
- [Architecture Overview](../architecture/README.md) - System design
- [UI Components](../components/UI-COMPONENTS.md) - Component reference
