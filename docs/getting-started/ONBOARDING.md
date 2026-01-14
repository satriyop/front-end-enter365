# Developer Onboarding

> Complete onboarding guide for new developers (1-2 hours)

## Table of Contents
- [IDE Setup](#ide-setup)
- [Project Understanding](#project-understanding)
- [Code Conventions](#code-conventions)
- [Development Workflow](#development-workflow)
- [Common Patterns](#common-patterns)

---

## IDE Setup

### VS Code (Recommended)

#### Required Extensions
| Extension | Purpose |
|-----------|---------|
| **Vue - Official** | Vue 3 + TypeScript support |
| **Tailwind CSS IntelliSense** | Tailwind autocomplete |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **TypeScript Vue Plugin (Volar)** | Vue + TS integration |

#### Recommended Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "vue.inlayHints.missingProps": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## Project Understanding

### What This App Does

**Enter365** is a Solar ERP frontend for Indonesian solar installation companies. It handles:

1. **Sales Pipeline**: Quotation → Invoice → Payment tracking
2. **Inventory**: Products, BOMs, Stock movements
3. **Projects**: Project management, Work orders
4. **Solar Proposals**: Advanced solar system sizing and financial projections

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | TanStack Query + Pinia | Server state vs UI state separation |
| API Layer | Level 2 Hooks | Simple, not overengineered |
| Styling | Tailwind + CSS Variables | Utility-first with theming |
| Components | Radix Vue primitives | Accessible, headless |

See [Architecture Decision Records](../architecture/adr/) for detailed reasoning.

### Key Files to Understand

| File | Purpose | Read First? |
|------|---------|-------------|
| `src/api/client.ts` | Axios setup, token refresh | Yes |
| `src/stores/auth.ts` | Auth state, login/logout | Yes |
| `src/router/index.ts` | All routes, auth guards | Yes |
| `src/utils/format.ts` | Indonesian formatters | Yes |
| `src/api/useQuotations.ts` | Example API hook | Yes |

---

## Code Conventions

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Pages | PascalCase + Page suffix | `QuotationListPage.vue` |
| Components | PascalCase | `DataTable.vue` |
| Composables | camelCase with `use` prefix | `useAutosave.ts` |
| API Hooks | camelCase with `use` prefix | `useQuotations.ts` |
| Utils | camelCase | `format.ts` |

### Component Structure

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'
import { useQuotations } from '@/api/useQuotations'
import { Button, Card } from '@/components/ui'

// 2. Props & Emits
const props = defineProps<{
  id: number
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

// 3. State
const filters = ref({ page: 1 })

// 4. Composables & Queries
const { data, isLoading } = useQuotations(filters)

// 5. Computed
const items = computed(() => data.value?.data ?? [])

// 6. Methods
function handleClick() {
  // ...
}
</script>

<template>
  <!-- Template -->
</template>
```

### TypeScript Rules

```typescript
// DO: Use explicit types for function params
function calculateTotal(items: LineItem[]): number { }

// DO: Use computed for derived state
const total = computed(() => items.value.reduce((sum, i) => sum + i.amount, 0))

// DON'T: Use `any`
function bad(data: any) { } // Avoid

// DON'T: Inline API calls
const data = await axios.get('/quotations') // Use hooks instead
```

### Tailwind Classes

```vue
<!-- DO: Use semantic color classes -->
<p class="text-muted-foreground">Description</p>
<div class="bg-card border-border">Content</div>

<!-- DON'T: Use hardcoded colors -->
<p class="text-slate-500">Bad</p>
<div class="bg-white border-slate-200">Bad</div>
```

---

## Development Workflow

### Daily Workflow

```
1. Pull latest changes
   git pull origin main

2. Start dev server
   npm run dev

3. Make changes
   - Edit files
   - TypeScript auto-checks

4. Test changes
   - Browser: http://localhost:5173
   - Console for errors

5. Run checks before commit
   npm run type-check
   npm run lint

6. Commit with clear message
   git commit -m "feat: add quotation export button"
```

### When API Changes

```bash
# Backend team updates API
# You regenerate types:
npm run types:generate

# TypeScript shows errors where API changed
# Fix affected code
```

### Debugging Tips

| Issue | Solution |
|-------|----------|
| API not responding | Check backend is running, check VITE_API_URL |
| 401 errors | Token expired, check localStorage |
| Component not updating | Check `ref` vs `computed`, check reactivity |
| TanStack Query stale | Force refetch or check query keys |

---

## Common Patterns

### List Page Pattern

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuotations } from '@/api/useQuotations'
import { Button, Card, DataTable, FilterBar, FilterGroup, Input, Select } from '@/components/ui'

// Filters
const filters = ref({
  page: 1,
  per_page: 10,
  search: '',
  status: '',
})

// Query
const { data, isLoading } = useQuotations(filters)
const items = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

// Status options (empty string = all)
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Quotations</h1>
        <p class="text-muted-foreground">Manage your quotations</p>
      </div>
      <Button as="router-link" to="/quotations/new">Create</Button>
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
      <DataTable :rows="items" :loading="isLoading" />
    </Card>
  </div>
</template>
```

### Form Page Pattern

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateQuotation } from '@/api/useQuotations'
import { Button, Card, Input, FormField } from '@/components/ui'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const toast = useToast()

const form = ref({
  contact_id: null,
  valid_until: '',
  notes: '',
})

const { mutate, isPending } = useCreateQuotation()

function handleSubmit() {
  mutate(form.value, {
    onSuccess: (data) => {
      toast.success('Quotation created')
      router.push(`/quotations/${data.id}`)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
</script>
```

### Detail Page Pattern

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuotation } from '@/api/useQuotations'

const route = useRoute()
const id = computed(() => Number(route.params.id))

const { data: quotation, isLoading } = useQuotation(id)
</script>
```

---

## Checklist

Before starting work, ensure you have:

- [ ] Node.js 18+ installed
- [ ] VS Code with recommended extensions
- [ ] Project cloned and `npm install` completed
- [ ] `.env` configured with correct API URL
- [ ] Dev server running (`npm run dev`)
- [ ] Read `src/api/client.ts` (auth interceptors)
- [ ] Read `src/stores/auth.ts` (auth flow)
- [ ] Understood component import pattern
- [ ] Understood API hook pattern

---

## Getting Help

| Resource | Location |
|----------|----------|
| Architecture | [docs/architecture/](../architecture/README.md) |
| Components | [docs/components/](../components/README.md) |
| API Patterns | [docs/api/](../api/README.md) |
| Troubleshooting | [docs/troubleshooting/](../troubleshooting/README.md) |
