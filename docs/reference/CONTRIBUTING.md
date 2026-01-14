# Contributing

> Guidelines for contributing to Enter365 frontend

## Quick Start

```bash
# Clone and setup
git clone <repository>
cd front-end-enter365
npm install
npm run dev
```

---

## Development Workflow

### 1. Create Branch

```bash
# Feature branch
git checkout -b feature/add-solar-battery-config

# Bug fix branch
git checkout -b fix/quotation-total-calculation

# Naming convention
# feature/ - New features
# fix/ - Bug fixes
# refactor/ - Code refactoring
# docs/ - Documentation only
```

### 2. Make Changes

Follow the coding standards below.

### 3. Test Changes

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Run tests
npm test

# Manual testing in browser
npm run dev
```

### 4. Commit

```bash
# Conventional commit format
git commit -m "feat: add battery configuration to solar proposals"
git commit -m "fix: correct total calculation in quotations"
git commit -m "docs: update API hooks documentation"
```

### 5. Push and Create PR

```bash
git push origin feature/add-solar-battery-config
# Create PR via GitHub
```

---

## Coding Standards

### TypeScript

```typescript
// Use explicit types for function parameters and returns
function calculatePayback(investment: number, annualSavings: number): number {
  return investment / annualSavings
}

// Use interfaces for objects
interface Contact {
  id: number
  name: string
  email: string
}

// Use type for unions/intersections
type Status = 'draft' | 'submitted' | 'approved'
```

### Vue Components

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'
import { useContacts } from '@/api/useContacts'

// 2. Props and emits
const props = defineProps<{
  contactId: number
}>()

const emit = defineEmits<{
  save: [contact: Contact]
  cancel: []
}>()

// 3. Composables
const { data: contacts } = useContacts()

// 4. Reactive state
const isLoading = ref(false)

// 5. Computed
const activeContacts = computed(() =>
  contacts.value?.filter(c => c.is_active)
)

// 6. Methods
function handleSubmit() {
  // ...
}

// 7. Lifecycle (if needed)
onMounted(() => {
  // ...
})
</script>

<template>
  <!-- Template follows script -->
</template>
```

### File Organization

```
src/
├── components/
│   └── ui/                 # Reusable UI components
│       ├── Button.vue
│       └── index.ts        # Re-exports
├── pages/
│   └── contacts/           # Feature pages
│       ├── ContactListPage.vue
│       └── ContactDetailPage.vue
├── composables/
│   └── useFormat.ts        # Reusable composables
└── api/
    └── useContacts.ts      # API hooks
```

---

## Component Guidelines

### UI Components

Use existing UI components from `@/components/ui/`:

```vue
<template>
  <Button variant="default">Save</Button>
  <Button variant="destructive">Delete</Button>
  <Badge status="draft">Draft</Badge>
</template>
```

### Styling

```vue
<!-- Use design tokens -->
<template>
  <div class="text-muted-foreground">Muted text</div>
  <div class="bg-card border-border">Card background</div>
</template>

<!-- DON'T use hardcoded colors -->
<template>
  <!-- Bad -->
  <div class="text-gray-500">Muted text</div>
  <div class="bg-white border-gray-200">Card</div>
</template>
```

### Icons

```vue
<script setup>
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
</script>

<template>
  <Button>
    <Plus class="w-4 h-4 mr-2" />
    Add
  </Button>
</template>
```

---

## API Guidelines

### Creating Hooks

```typescript
// src/api/useNewFeature.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { NewFeature } from './types'

// Query hook
export function useNewFeatures(filters?: Filters) {
  return useQuery({
    queryKey: ['new-features', filters],
    queryFn: async () => {
      const { data } = await api.get('/new-features', { params: filters })
      return data as NewFeature[]
    },
  })
}

// Mutation hook
export function useCreateNewFeature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateNewFeaturePayload) => {
      const { data } = await api.post('/new-features', payload)
      return data as NewFeature
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-features'] })
    },
  })
}
```

---

## Testing Guidelines

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('calculatePayback', () => {
  it('calculates payback period correctly', () => {
    const result = calculatePayback(72000000, 10000000)
    expect(result).toBeCloseTo(7.2, 1)
  })
})
```

### Component Tests

```typescript
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import ContactCard from './ContactCard.vue'

describe('ContactCard', () => {
  it('displays contact name', () => {
    const { wrapper } = renderWithProviders(ContactCard, {
      props: { contact: { id: 1, name: 'PT Test' } },
    })

    expect(wrapper.text()).toContain('PT Test')
  })
})
```

---

## Commit Message Format

### Structure

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructure |
| `test` | Adding tests |
| `chore` | Maintenance |

### Examples

```bash
# Feature
feat(solar): add battery configuration component

# Bug fix
fix(quotations): correct line item total calculation

Fixes issue where discount was applied twice to line items.

# Documentation
docs(api): update hooks pattern documentation

# Refactor
refactor(components): extract shared filter logic
```

---

## Pull Request Guidelines

### PR Title

```
feat(solar): add battery configuration wizard

- Add BatteryConfigurator component
- Add useBatteryCalculator composable
- Update solar proposal wizard to include battery step
```

### PR Description Template

```markdown
## Summary
Brief description of changes

## Changes
- List of specific changes
- Another change

## Testing
- How was this tested?
- Any edge cases covered?

## Screenshots (if applicable)
[Add screenshots for UI changes]
```

### Review Checklist

- [ ] TypeScript types are correct
- [ ] UI follows design system
- [ ] Tests pass
- [ ] No console.log statements
- [ ] Code is documented where needed

---

## Getting Help

| Resource | Purpose |
|----------|---------|
| `docs/` folder | Architecture, patterns |
| `CLAUDE.md` | AI assistant context |
| Team chat | Questions, discussions |

---

## Related Documentation

- [../getting-started/README.md](../getting-started/README.md) - Development setup
- [../architecture/README.md](../architecture/README.md) - Architecture overview
- [../components/README.md](../components/README.md) - Component catalog
