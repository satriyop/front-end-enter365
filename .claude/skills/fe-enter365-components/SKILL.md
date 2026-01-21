# Enter365 Components

## Overview

Components follow a **Shadcn-vue inspired** design system with Radix Vue primitives.

## Component Categories

```
src/components/
├── document/      # Document-specific (forms, detail views)
├── ui/            # Reusable UI primitives
├── charts/        # Data visualization
└── {domain}/      # Domain-specific (quotations, invoices)
```

## UI Components (`@/components/ui`)

### Core Components

| Component | Purpose | Import |
|-----------|---------|--------|
| `Button` | Clickable actions | `import { Button } from '@/components/ui'` |
| `Input` | Text inputs | `import { Input } from '@/components/ui'` |
| `Select` | Dropdowns | `import { Select } from '@/components/ui'` |
| `Card` | Content containers | `import { Card } from '@/components/ui'` |
| `Badge` | Status indicators | `import { Badge } from '@/components/ui'` |
| `Modal` | Dialogs | `import { Modal } from '@/components/ui'` |
| `FilterBar` | Filter containers | `import { FilterBar } from '@/components/ui'` |
| `FilterGroup` | Filter field wrapper | `import { FilterGroup } from '@/components/ui'` |
| `VirtualList` | Large list scrolling | `import { VirtualList } from '@/components/ui'` |
| `ResponsiveTable` | Mobile-friendly tables | `import { ResponsiveTable } from '@/components/ui'` |

### Button

```vue
<!-- Variants -->
<Button>Default (Orange)</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Secondary</Button>
<Button variant="secondary">Less Prominent</Button>
<Button variant="ghost">Minimal</Button>
<Button variant="success">Positive</Button>
<Button variant="warning">Caution</Button>

<!-- Sizes -->
<Button size="xs">Extra Small</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>

<!-- States -->
<Button :loading="isSubmitting">Save</Button>
<Button :disabled="!isValid">Submit</Button>

<!-- With Icon -->
<Button>
  <Plus class="h-4 w-4 mr-2" />
  Add Item
</Button>
```

### Badge

```vue
<!-- Variants -->
<Badge>Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">Info</Badge>

<!-- Domain Status (auto-colors) -->
<Badge status="draft">Draft</Badge>
<Badge status="pending">Pending</Badge>
<Badge status="approved">Approved</Badge>
<Badge status="rejected">Rejected</Badge>
<Badge status="completed">Completed</Badge>
<Badge status="cancelled">Cancelled</Badge>
```

### Select

```vue
<Select
  v-model="filters.status"
  :options="statusOptions"
  placeholder="Select status..."
/>

<!-- Options format -->
const statusOptions = [
  { value: '', label: 'All Status' },    // Empty = show all
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
]
```

### VirtualList

```vue
<VirtualList
  :items="products"
  :item-height="48"
  :container-height="400"
  :overscan="5"
>
  <template #default="{ item, index }">
    <div class="flex items-center px-4 border-b">
      {{ index + 1 }}. {{ item.name }}
    </div>
  </template>
</VirtualList>
```

### ResponsiveTable

```vue
<ResponsiveTable
  :columns="columns"
  :data="items"
  :loading="isLoading"
  @row-click="handleRowClick"
>
  <template #cell-status="{ row }">
    <Badge :status="row.status">{{ row.status }}</Badge>
  </template>
</ResponsiveTable>

const columns: ResponsiveColumn[] = [
  { key: 'number', label: 'Number', priority: 1 },
  { key: 'customer', label: 'Customer', priority: 1 },
  { key: 'total', label: 'Total', priority: 2, align: 'right' },
  { key: 'status', label: 'Status', priority: 1 },
]
```

## Document Components (`@/components/document`)

### LineItemsTable

```vue
<LineItemsTable
  :items="items"
  :calculations="calculations"
  :can-add="!isDisabled"
  :can-remove="!isDisabled"
  :can-duplicate="!isDisabled"
  :can-reorder="!isDisabled"
  :show-discount="true"
  :show-product-select="true"
  :min-items="1"
  :disabled="isDisabled"
  :errors="itemErrors"
  @add="addItem"
  @remove="removeItem"
  @update="updateItem"
  @duplicate="duplicateItem"
  @reorder="reorderItems"
/>
```

### DocumentFormLayout

```vue
<DocumentFormLayout
  :title="isEditing ? 'Edit Quotation' : 'New Quotation'"
  :subtitle="quotation?.number"
  :is-loading="isLoading"
  :is-submitting="isSubmitting"
  :is-dirty="isDirty"
  :can-submit="isValid"
  @submit="handleSubmit"
  @cancel="router.back()"
>
  <!-- Form content -->
  <template #sidebar>
    <!-- Sidebar content (customer info, dates, etc.) -->
  </template>

  <template #main>
    <!-- Main content (line items, notes, etc.) -->
  </template>

  <template #footer>
    <TotalsSummary :totals="totals" />
  </template>
</DocumentFormLayout>
```

### DocumentDetailLayout

```vue
<DocumentDetailLayout
  :title="invoice.number"
  :status="invoice.status"
  :is-loading="isLoading"
  :breadcrumbs="[
    { label: 'Invoices', to: { name: 'invoices' } },
    { label: invoice.number },
  ]"
>
  <template #actions>
    <WorkflowActions
      :workflow="workflow"
      :current-state="invoice.status"
      @transition="handleTransition"
    />
  </template>

  <template #content>
    <!-- Detail content -->
  </template>
</DocumentDetailLayout>
```

### TotalsSummary

```vue
<TotalsSummary
  :totals="totals"
  :show-tax-breakdown="true"
  :currency="'IDR'"
/>

<!-- totals structure -->
{
  subtotal: 1000000,
  discount: 50000,
  taxable: 950000,
  tax: 104500,
  total: 1054500
}
```

## Page Patterns

### List Page Template
```vue
<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Quotations</h1>
        <p class="text-muted-foreground">Manage customer quotations</p>
      </div>
      <Button :to="{ name: 'quotation-new' }">
        <Plus class="h-4 w-4 mr-2" />
        New Quotation
      </Button>
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
      <ResponsiveTable
        :columns="columns"
        :data="items"
        :loading="isLoading"
        @row-click="(row) => router.push({ name: 'quotation-detail', params: { id: row.id } })"
      />
      <Pagination v-if="pagination" v-bind="pagination" @change="goToPage" />
    </Card>
  </div>
</template>
```

### Form Page Template
```vue
<template>
  <DocumentFormLayout
    :title="isEditing ? 'Edit Quotation' : 'New Quotation'"
    :is-submitting="isSubmitting"
    @submit="handleSubmit"
  >
    <template #sidebar>
      <Card>
        <FormField label="Customer" :error="errors.contact_id">
          <CustomerSelect v-model="form.contact_id" />
        </FormField>
        <FormField label="Date" :error="errors.date">
          <Input type="date" v-model="form.date" />
        </FormField>
      </Card>
    </template>

    <template #main>
      <Card title="Line Items">
        <LineItemsTable
          :items="items"
          :calculations="calculations"
          @add="addItem"
          @remove="removeItem"
          @update="updateItem"
        />
      </Card>
    </template>

    <template #footer>
      <TotalsSummary :totals="totals" />
    </template>
  </DocumentFormLayout>
</template>
```

## Design Tokens

**ALWAYS use semantic classes, NOT hardcoded colors:**

| Use This | NOT This |
|----------|----------|
| `text-muted-foreground` | `text-slate-500` |
| `bg-card` | `bg-white` |
| `border-border` | `border-slate-200` |
| `text-destructive` | `text-red-500` |
| `bg-primary` | `bg-orange-500` |

## DO NOT

- Use native `<select>`, `<input>`, `<button>`
- Use hardcoded colors
- Use `variant="primary"` → use `variant="default"` or omit
- Use `variant="danger"` → use `variant="destructive"`
- Create inline styles for common patterns
