# Components

> UI component library for Enter365

## Overview

Enter365 uses a **Shadcn-Vue inspired design system** with:
- Radix Vue for headless primitives
- Tailwind CSS for styling
- CSS variables for theming
- Class Variance Authority (CVA) for variants

---

## Quick Import

```typescript
// Core components
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  Badge,
  Modal,
  Alert,
  DataTable,
  Pagination,
  FilterBar,
  FilterGroup,
  FormField,
  EmptyState,
  LoadingSkeleton,
} from '@/components/ui'

// Icons
import { Plus, Edit, Trash2, ChevronDown } from 'lucide-vue-next'
```

---

## Component Categories

| Category | Components | Documentation |
|----------|------------|---------------|
| **Core UI** | Button, Input, Select, Badge | [UI-COMPONENTS.md](UI-COMPONENTS.md) |
| **Forms** | FormField, CurrencyInput, validation | [FORM-PATTERNS.md](FORM-PATTERNS.md) |
| **Data Display** | DataTable, StatCard, Pagination | [DATA-DISPLAY.md](DATA-DISPLAY.md) |
| **Layout** | Card, FilterBar, Modal | [LAYOUTS.md](LAYOUTS.md) |
| **Tokens** | Colors, typography, spacing | [DESIGN-TOKENS.md](DESIGN-TOKENS.md) |

---

## Component List

### Input Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Button` | Actions, links | `variant`, `size`, `as`, `to` |
| `Input` | Text input | `type`, `placeholder`, `error` |
| `Select` | Dropdown | `options`, `v-model` |
| `Textarea` | Multi-line | `rows`, `placeholder` |
| `CurrencyInput` | IDR formatting | `v-model` |
| `NumberInput` | Numeric | `min`, `max`, `step` |
| `Checkbox` | Boolean | `v-model` |
| `Switch` | Toggle | `v-model` |

### Display Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Card` | Container | `padding` |
| `Badge` | Status label | `variant`, `status` |
| `Alert` | Messages | `variant` |
| `StatCard` | Metrics | `label`, `value`, `trend` |
| `DataTable` | Data display | `rows`, `columns`, `loading` |
| `Pagination` | Navigation | `currentPage`, `totalPages` |

### Feedback Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Modal` | Dialogs | `open`, `title`, `size` |
| `Toast` | Notifications | via `useToast()` |
| `LoadingSkeleton` | Loading state | - |
| `EmptyState` | No data | `title`, `description`, `icon` |

### Layout Components

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `FilterBar` | Filter container | - |
| `FilterGroup` | Filter item | `grow`, `minWidth` |
| `FormField` | Label + error | `label`, `error` |
| `Breadcrumbs` | Navigation | auto from route |
| `Tabs` | Tab navigation | - |

---

## Design Principles

### 1. Use Semantic Colors

```vue
<!-- DO: Use semantic classes -->
<p class="text-muted-foreground">Secondary text</p>
<div class="bg-card border-border">Card</div>

<!-- DON'T: Hardcode colors -->
<p class="text-slate-500">Bad</p>
<div class="bg-white border-slate-200">Bad</div>
```

### 2. Use Component Variants

```vue
<!-- DO: Use variant props -->
<Button variant="destructive">Delete</Button>
<Badge status="approved">Approved</Badge>

<!-- DON'T: Add custom classes -->
<Button class="bg-red-500">Delete</Button>
```

### 3. Use Empty String for "All" Filters

```typescript
const statusOptions = [
  { value: '', label: 'All Status' },  // Empty = show all
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
]
```

---

## Quick Patterns

### Page Header

```vue
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-2xl font-semibold">Page Title</h1>
    <p class="text-muted-foreground">Description</p>
  </div>
  <Button as="router-link" to="/new">
    <Plus class="w-4 h-4 mr-2" />
    Create
  </Button>
</div>
```

### Filter Bar

```vue
<FilterBar class="mb-6">
  <FilterGroup grow>
    <Input v-model="filters.search" placeholder="Search..." />
  </FilterGroup>
  <FilterGroup min-width="150px">
    <Select v-model="filters.status" :options="statusOptions" />
  </FilterGroup>
</FilterBar>
```

### Data Card

```vue
<Card :padding="false">
  <DataTable :rows="items" :columns="columns" :loading="isLoading" />
  <Pagination
    v-if="pagination"
    :current-page="pagination.current_page"
    :total-pages="pagination.last_page"
    @change="changePage"
  />
</Card>
```

---

## Documentation Index

- [DESIGN-TOKENS.md](DESIGN-TOKENS.md) - Colors, typography, spacing
- [UI-COMPONENTS.md](UI-COMPONENTS.md) - Button, Input, Select, Badge
- [FORM-PATTERNS.md](FORM-PATTERNS.md) - Form handling, validation
- [DATA-DISPLAY.md](DATA-DISPLAY.md) - Tables, cards, pagination
- [LAYOUTS.md](LAYOUTS.md) - Page layouts, modals
