# UI Components

> Core UI components reference

## Button

### Import

```typescript
import { Button } from '@/components/ui'
```

### Variants

| Variant | Usage | Example |
|---------|-------|---------|
| `default` | Primary actions | Save, Create |
| `destructive` | Delete, danger | Delete, Remove |
| `outline` | Secondary actions | Cancel, Back |
| `secondary` | Less prominent | Edit |
| `ghost` | Minimal, inline | View |
| `success` | Positive actions | Approve |
| `warning` | Caution actions | Archive |
| `link` | Text link style | Learn more |

### Sizes

| Size | Height | Usage |
|------|--------|-------|
| `xs` | 28px | Compact tables |
| `sm` | 36px | Secondary actions |
| `default` | 40px | Primary actions |
| `lg` | 44px | Hero actions |
| `icon` | 40x40px | Icon only |
| `icon-sm` | 32x32px | Small icon |

### Usage

```vue
<script setup lang="ts">
import { Button } from '@/components/ui'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
</script>

<template>
  <!-- Basic -->
  <Button>Save</Button>
  <Button variant="destructive">Delete</Button>
  <Button variant="outline">Cancel</Button>

  <!-- With icon -->
  <Button>
    <Plus class="w-4 h-4 mr-2" />
    Create
  </Button>

  <!-- Icon only -->
  <Button variant="ghost" size="icon">
    <Edit class="w-4 h-4" />
  </Button>

  <!-- As router link -->
  <Button as="router-link" to="/quotations/new">
    Create Quotation
  </Button>

  <!-- Loading state -->
  <Button :disabled="isPending">
    {{ isPending ? 'Saving...' : 'Save' }}
  </Button>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'default'` | Visual style |
| `size` | string | `'default'` | Size |
| `as` | string | `'button'` | Element type |
| `to` | string | - | Router link destination |
| `disabled` | boolean | `false` | Disabled state |

---

## Input

### Import

```typescript
import { Input } from '@/components/ui'
```

### Usage

```vue
<template>
  <!-- Basic -->
  <Input v-model="form.name" placeholder="Enter name" />

  <!-- With type -->
  <Input v-model="form.email" type="email" />
  <Input v-model="form.password" type="password" />
  <Input v-model="form.date" type="date" />

  <!-- With error -->
  <Input v-model="form.email" :error="!!errors.email" />

  <!-- Disabled -->
  <Input v-model="form.name" disabled />
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | string | `'text'` | Input type |
| `placeholder` | string | - | Placeholder text |
| `error` | boolean | `false` | Error state |
| `disabled` | boolean | `false` | Disabled state |

---

## Select

### Import

```typescript
import { Select } from '@/components/ui'
```

### Usage

```vue
<script setup lang="ts">
import { Select } from '@/components/ui'

const statusOptions = [
  { value: '', label: 'All Status' },  // Empty string = show all
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const status = ref('')
</script>

<template>
  <Select v-model="status" :options="statusOptions" />

  <!-- With placeholder -->
  <Select
    v-model="contactId"
    :options="contactOptions"
    placeholder="Select contact..."
  />
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | Array | `[]` | `{ value, label }[]` |
| `placeholder` | string | - | Placeholder text |
| `disabled` | boolean | `false` | Disabled state |

### Option Format

```typescript
interface SelectOption {
  value: string | number
  label: string
}
```

---

## Badge

### Import

```typescript
import { Badge } from '@/components/ui'
```

### Variants

| Variant | Color | Usage |
|---------|-------|-------|
| `default` | Gray | Generic |
| `primary` | Orange | Highlighted |
| `success` | Green | Positive |
| `warning` | Amber | Caution |
| `destructive` | Red | Error/danger |
| `info` | Blue | Information |

### Status (Domain-Specific)

| Status | Color | Usage |
|--------|-------|-------|
| `draft` | Gray | Draft items |
| `pending` | Amber | Awaiting action |
| `submitted` | Blue | Submitted |
| `approved` | Green | Approved |
| `rejected` | Red | Rejected |
| `completed` | Green | Completed |
| `cancelled` | Gray | Cancelled |

### Usage

```vue
<template>
  <!-- By variant -->
  <Badge>Default</Badge>
  <Badge variant="success">Success</Badge>
  <Badge variant="destructive">Error</Badge>

  <!-- By status (recommended for business logic) -->
  <Badge :status="quotation.status">
    {{ quotation.status }}
  </Badge>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | `'default'` | Visual style |
| `status` | string | - | Domain status (overrides variant) |

---

## Card

### Import

```typescript
import { Card } from '@/components/ui'
```

### Usage

```vue
<template>
  <!-- With padding (default) -->
  <Card>
    <h2>Card Title</h2>
    <p>Card content</p>
  </Card>

  <!-- Without padding (for tables) -->
  <Card :padding="false">
    <DataTable :rows="items" />
  </Card>

  <!-- With custom classes -->
  <Card class="p-8">
    <Content />
  </Card>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `padding` | boolean | `true` | Include default padding |

---

## Modal

### Import

```typescript
import { Modal } from '@/components/ui'
```

### Sizes

| Size | Width | Usage |
|------|-------|-------|
| `sm` | 400px | Confirmations |
| `md` | 500px | Simple forms |
| `lg` | 600px | Complex forms |
| `xl` | 800px | Large content |
| `2xl` | 1000px | Full features |

### Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Modal, Button } from '@/components/ui'

const showModal = ref(false)
</script>

<template>
  <Button @click="showModal = true">Open Modal</Button>

  <Modal
    :open="showModal"
    @close="showModal = false"
    title="Modal Title"
    size="lg"
  >
    <p>Modal content here</p>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="showModal = false">
          Cancel
        </Button>
        <Button @click="handleSave">
          Save
        </Button>
      </div>
    </template>
  </Modal>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | boolean | `false` | Open state |
| `title` | string | - | Modal title |
| `size` | string | `'md'` | Modal size |

### Slots

| Slot | Description |
|------|-------------|
| `default` | Modal body |
| `footer` | Modal footer |

---

## Alert

### Import

```typescript
import { Alert } from '@/components/ui'
```

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Information |
| `warning` | Warnings |
| `destructive` | Errors |

### Usage

```vue
<template>
  <Alert>
    This is an informational message.
  </Alert>

  <Alert variant="warning">
    Please review before proceeding.
  </Alert>

  <Alert variant="destructive">
    {{ errorMessage }}
  </Alert>
</template>
```

---

## EmptyState

### Import

```typescript
import { EmptyState } from '@/components/ui'
```

### Usage

```vue
<script setup lang="ts">
import { EmptyState, Button } from '@/components/ui'
import { FileText, Plus } from 'lucide-vue-next'
</script>

<template>
  <EmptyState
    :icon="FileText"
    title="No quotations"
    description="Create your first quotation to get started."
  >
    <Button>
      <Plus class="w-4 h-4 mr-2" />
      Create Quotation
    </Button>
  </EmptyState>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | Component | - | Lucide icon component |
| `title` | string | - | Title text |
| `description` | string | - | Description text |

---

## LoadingSkeleton

### Import

```typescript
import { LoadingSkeleton } from '@/components/ui'
```

### Usage

```vue
<template>
  <!-- Basic skeleton -->
  <LoadingSkeleton v-if="isLoading" />

  <!-- Or in conditional -->
  <template v-if="isLoading">
    <LoadingSkeleton />
  </template>
  <template v-else>
    <DataTable :rows="items" />
  </template>
</template>
```

---

## Related Documentation

- [DESIGN-TOKENS.md](DESIGN-TOKENS.md) - Colors, spacing
- [FORM-PATTERNS.md](FORM-PATTERNS.md) - Form handling
- [DATA-DISPLAY.md](DATA-DISPLAY.md) - Tables, cards
- [LAYOUTS.md](LAYOUTS.md) - Page layouts
