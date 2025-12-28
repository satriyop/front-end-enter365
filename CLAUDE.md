# Enter365 Frontend - Development Guidelines

## Project Type

**This is a Vue 3 SPA (Single Page Application)** - NOT Livewire/Volt.

| Technology | Used |
|------------|------|
| Framework | Vue 3 (Composition API) |
| Build Tool | Vite |
| Routing | Vue Router |
| State/Data | TanStack Query (Vue Query) |
| UI Primitives | Radix Vue |
| Styling | Tailwind CSS |
| Icons | Lucide Vue Next |

This frontend communicates with a Laravel API backend via REST. Do NOT use Livewire, Volt, or Blade templates in this project.

---

## UI Component System

This project uses a **Shadcn-vue inspired design system** with Radix Vue primitives. All UI must use the established components and design tokens.

### Core UI Components (ALWAYS USE THESE)

Import from `@/components/ui/`:

| Component | Usage |
|-----------|-------|
| `Button` | All buttons and clickable actions |
| `Input` | Text inputs, search fields |
| `Select` | Dropdowns, filters (supports empty string values) |
| `Card` | Content containers, data tables wrapper |
| `Badge` | Status indicators, labels |
| `Modal` | Dialogs, confirmations |
| `FilterBar` | Filter section container |
| `FilterGroup` | Labeled filter field wrapper |

### Button Variants

```vue
<Button>Default (Primary Orange)</Button>
<Button variant="destructive">Delete/Danger</Button>
<Button variant="outline">Secondary Action</Button>
<Button variant="secondary">Less Prominent</Button>
<Button variant="ghost">Minimal</Button>
<Button variant="success">Positive Action</Button>
<Button variant="warning">Caution</Button>
```

### Button Sizes

```vue
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
<Button size="icon-sm">Small Icon</Button>
```

### Badge Variants

```vue
<Badge>Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error/Danger</Badge>
<Badge variant="info">Information</Badge>
```

### Badge with Status (Domain-Specific)

For business statuses, use the `status` prop which provides consistent colors:

```vue
<Badge status="draft">Draft</Badge>
<Badge status="pending">Pending</Badge>
<Badge status="approved">Approved</Badge>
<Badge status="rejected">Rejected</Badge>
<Badge status="completed">Completed</Badge>
<Badge status="cancelled">Cancelled</Badge>
```

### Select with Filter Options

For filter dropdowns with "All" option, use empty string:

```typescript
const statusOptions = [
  { value: '', label: 'All Status' },  // Empty string = show all
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
]
```

### Page Layout Pattern

```vue
<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Page Title</h1>
        <p class="text-muted-foreground">Description</p>
      </div>
      <Button>Action</Button>
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
      <!-- Table or content here -->
    </Card>
  </div>
</template>
```

### Design Tokens (CSS Variables)

Use semantic color classes, NOT hardcoded colors:

| Use This | NOT This |
|----------|----------|
| `text-muted-foreground` | `text-slate-500` |
| `bg-card` | `bg-white` |
| `border-border` | `border-slate-200` |
| `text-destructive` | `text-red-500` |
| `bg-primary` | `bg-orange-500` |

### Icons

Use Lucide Vue Next icons:

```vue
import { Plus, Edit, Trash2, ChevronDown } from 'lucide-vue-next'
```

### Dropdown Menus

Use Radix Vue DropdownMenu for action menus:

```vue
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
} from 'radix-vue'
```

## DO NOT

- Use native `<select>`, `<input>`, `<button>` - use UI components
- Use hardcoded colors like `bg-white`, `text-slate-500`
- Use `variant="primary"` (removed) - use `variant="default"` or omit
- Use `variant="danger"` (removed) - use `variant="destructive"`
- Use `variant="error"` (removed) - use `variant="destructive"`
- Create inline styles for common patterns

## File Structure

```
src/
├── components/
│   └── ui/           # Reusable UI components (Button, Input, etc.)
├── pages/            # Page components
├── composables/      # Vue composables
├── api/              # API hooks (TanStack Query)
└── utils/            # Utility functions
```

## Dependencies

- **radix-vue** - Headless UI primitives
- **lucide-vue-next** - Icons
- **class-variance-authority** - Variant management
- **tailwind-merge** - Class merging
- **clsx** - Conditional classes

---

## SPA + API Architecture Notes

### File Downloads in SPA

Since this is a Vue SPA with token-based auth (Sanctum), `window.open(url)` does NOT include the auth token.

**IMPORTANT:** Always use the blob download pattern for file downloads. Do NOT make routes public just for convenience - files often contain sensitive data (prices, costs, etc.).

**Blob download pattern (PREFERRED):**
```typescript
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
```

**Example usage in component:**
```typescript
const isDownloading = ref(false)

async function handleDownload() {
  isDownloading.value = true
  try {
    await downloadFile('/exports/report', 'report.xlsx')
    toast.success('Downloaded')
  } catch (err) {
    toast.error('Download failed')
  } finally {
    isDownloading.value = false
  }
}
```
