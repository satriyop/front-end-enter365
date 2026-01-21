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

### Design Tokens

| Use | NOT |
|-----|-----|
| `text-muted-foreground` | `text-slate-500` |
| `bg-card` | `bg-white` |
| `border-border` | `border-slate-200` |
| `text-destructive` | `text-red-500` |
| `bg-primary` | `bg-orange-500` |

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

## Documentation

| Doc | Path |
|-----|------|
| AI Agent Guide | `docs/AGENT.md` |
| Quick Reference | `docs/QUICK-REFERENCE.md` |
| Architecture | `docs/architecture/README.md` |
| Migration Checklist | `docs/MIGRATION-CHECKLIST.md` |
