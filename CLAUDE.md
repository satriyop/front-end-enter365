# Enter365 Frontend

## Project Context

| Aspect | Value |
|--------|-------|
| **Type** | Vue 3 SPA (NOT Livewire/Volt) |
| **Backend** | `/Users/satriyo/dev/laravel-project/enter365` (Laravel API) |
| **Stack** | Vue 3, Vite, TanStack Query, Radix Vue, Tailwind CSS |

## Skills (Detailed Patterns)

Claude skills in `.claude/skills/` provide comprehensive patterns:

| Skill | Use For |
|-------|---------|
| `fe-enter365-architecture` | Project structure, SOLID principles, layers |
| `fe-enter365-components` | UI components, layouts, design tokens |
| `fe-enter365-composables` | useDocumentForm, useLineItems, useResourceList |
| `fe-enter365-services` | Strategy pattern, domain services |
| `fe-enter365-api` | TanStack Query, CRUD hooks, caching |
| `fe-enter365-state-machine` | Document workflows, transitions |
| `fe-enter365-infrastructure` | Event bus, logger, DI, feature flags |
| `fe-enter365-testing` | Factories, mocks, test patterns |

## Critical Rules

### DO NOT
- Use native `<select>`, `<input>`, `<button>` → use `@/components/ui`
- Use hardcoded colors (`bg-white`, `text-slate-500`) → use semantic tokens
- Use `variant="primary"` → use `variant="default"` or omit
- Use `variant="danger"` or `variant="error"` → use `variant="destructive"`
- Use `window.open()` for authenticated downloads → use blob pattern
- Hand-write request/mutation interfaces when a generated schema exists in `src/api/types.ts` → use `components['schemas']['StoreXxxRequest']`
- Use `.nullable()` on string fields in Zod form schemas → use `.optional().default('')`

### Design Tokens

| Use | NOT |
|-----|-----|
| `text-muted-foreground` | `text-slate-500` |
| `bg-card` | `bg-white` |
| `border-border` | `border-slate-200` |
| `text-destructive` | `text-red-500` |
| `bg-primary` | `bg-orange-500` |

## API Types (Generated from Scramble)

`src/api/types.ts` is auto-generated from the Laravel backend via Dedoc Scramble.

- **Response types**: `export type Foo = components['schemas']['FooResource']` (already done)
- **Request types**: `export type CreateFooData = components['schemas']['StoreFooRequest']` (use this instead of hand-writing interfaces)
- **Only hand-write** filter interfaces (`FooFilters`) and types that have no generated schema
- When adding a new API hook, check `types.ts` for matching `Store*Request` / `Update*Request` schemas first

## Zod Form Validation

Form schemas in `src/utils/validation.ts` must use the correct patterns to avoid TypeScript errors with form components.

### Schema Patterns

| Field Type | Pattern | Result Type |
|------------|---------|-------------|
| Required string | `requiredString('Name')` | `string` |
| Optional string | `.optional().default('')` | `string` |
| Foreign key ID | `.optional().nullable()` | `number \| null \| undefined` |

### Why No `.nullable()` for Strings

Form components (`Input`, `Textarea`) expect `string | undefined`, not `string | null | undefined`. Using `.nullable()` causes TypeScript errors.

```typescript
// WRONG - causes type mismatch with form components
phone: z.string().optional().nullable()  // → string | null | undefined

// CORRECT - works with form components
phone: z.string().optional().default('')  // → string

// CORRECT - nullable OK for foreign keys (genuinely null in DB)
contact_id: z.number().optional().nullable()
```

### Form Data Flow

```
API Response (null)  →  Form (empty string)  →  API Request (null)
     ↓                        ↓                       ↓
warehouse.phone: null   phone: ''              payload.phone: formValues.phone || null
```

The conversion happens at form boundaries:
- **Loading**: `phone: warehouse.phone ?? ''` (null → empty string)
- **Saving**: `phone: formValues.phone || null` (empty string → null)

## Quick Patterns

### UI Components
```typescript
import { Button, Input, Select, Card, Badge, Modal, FilterBar, FilterGroup } from '@/components/ui'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
```

### Filter Options (Empty = All)
```typescript
const options = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
]
```

### Status Badge
```vue
<Badge status="draft">Draft</Badge>
<Badge status="approved">Approved</Badge>
```

### Authenticated File Download
```typescript
// ALWAYS use blob pattern for authenticated downloads
const response = await api.get(url, { responseType: 'blob' })
const blob = new Blob([response.data])
const link = document.createElement('a')
link.href = URL.createObjectURL(blob)
link.download = filename
link.click()
URL.revokeObjectURL(link.href)
```

### Export as Mutation (Not Query)
Use `useMutation` for file exports since downloading is an action, not data fetching:
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

### Account Lookups by Type
When fetching accounts for dropdowns, filter by account type:
```typescript
const { data: assetAccounts } = useAccountsLookup('asset')      // Inventory accounts
const { data: expenseAccounts } = useAccountsLookup('expense')  // COGS, Purchase accounts
const { data: revenueAccounts } = useAccountsLookup('revenue')  // Sales accounts
```

### Select Options with Mixed Types
When building Select options that mix empty string with IDs, use consistent string values:
```typescript
const parentOptions = computed(() => [
  { value: '', label: 'No Parent' },  // Empty = null
  ...items.value?.map(i => ({ value: String(i.id), label: i.name })) ?? [],
])

// In template - convert back to number or null
<Select
  :model-value="parentId ?? ''"
  :options="parentOptions"
  @update:model-value="(v) => parentId = v ? Number(v) : null"
/>
```

## Documentation

| Doc | Path |
|-----|------|
| AI Agent Guide | `docs/AGENT.md` |
| Quick Reference | `docs/QUICK-REFERENCE.md` |
| Architecture | `docs/architecture/README.md` |
| Migration Checklist | `docs/MIGRATION-CHECKLIST.md` |
