# Enter365 Components

## Overview

Components follow a **Shadcn-vue inspired** design system with Radix Vue primitives.

## Component Categories

```
src/components/
├── charts/        # Data visualization (5 components)
├── document/      # Document layouts & shared (6 components)
├── invoices/      # Invoice-specific (2 components)
├── maps/          # Map components (1 component)
├── projects/      # Project management (6 components)
├── quotations/    # Quotation CRM (3 components)
├── solar/         # Solar proposal (7 components)
├── ui/            # Reusable UI primitives (30+ components)
└── *.vue          # Root-level cross-cutting (14 components)
```

## UI Components (`@/components/ui`)

### Component Inventory

| Category | Components |
|----------|------------|
| **Core** | Button, Input, Badge, Card, StatCard, Modal, Alert |
| **Form** | FormField, Textarea, Select, CurrencyInput |
| **Data Display** | DataTable, Pagination, EmptyState, LoadingSkeleton, PageSkeleton |
| **Dialogs** | ConfirmDialog, ConfirmationModal |
| **Status** | StatusBadge |
| **Navigation** | Breadcrumbs |
| **Filters** | FilterBar, FilterGroup, FilterPresetDropdown |
| **Utilities** | CopyButton, ExportButton, ThemeToggle, PullToRefresh |
| **Virtualization** | VirtualTable, VirtualList, ResponsiveTable |
| **Notifications** | Toast, ToastProvider, useToast |

### Exported Types
```typescript
import type {
  ButtonVariant, ButtonSize,
  InputSize,
  BadgeVariant, StatusType,
  ModalSize,
  AlertVariant,
  ResponsiveColumn,
  ToastType, ToastVariant, ToastOptions,
} from '@/components/ui'
```

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

### Badge & StatusBadge

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

<!-- StatusBadge (alternate) -->
<StatusBadge :status="invoice.status" />
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

### CurrencyInput

```vue
<CurrencyInput v-model="form.amount" />
```

### FormField

```vue
<FormField label="Customer Name" :error="errors.name" required>
  <Input v-model="form.name" />
</FormField>
```

### DataTable

```vue
<DataTable
  :columns="columns"
  :data="items"
  :loading="isLoading"
  @row-click="handleRowClick"
>
  <template #cell-status="{ row }">
    <Badge :status="row.status">{{ row.status }}</Badge>
  </template>
</DataTable>
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

### VirtualList & VirtualTable

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

### Filters

```vue
<FilterBar class="mb-6">
  <FilterGroup grow>
    <Input v-model="filters.search" placeholder="Search..." />
  </FilterGroup>
  <FilterGroup min-width="150px">
    <Select v-model="filters.status" :options="statusOptions" />
  </FilterGroup>
  <FilterGroup>
    <FilterPresetDropdown :presets="presets" @select="applyPreset" />
  </FilterGroup>
</FilterBar>
```

### Toast System

```typescript
import { useToast } from '@/components/ui'

const { toast } = useToast()

toast({ title: 'Saved', description: 'Document saved successfully', variant: 'success' })
toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' })
```

### EmptyState

```vue
<EmptyState
  title="No quotations yet"
  description="Create your first quotation to get started"
>
  <Button @click="createNew">
    <Plus class="h-4 w-4 mr-2" /> New Quotation
  </Button>
</EmptyState>
```

### Skeletons

```vue
<!-- Loading state for a full page -->
<PageSkeleton />

<!-- Custom loading skeleton -->
<LoadingSkeleton class="h-8 w-32" />
```

### Dialogs

```vue
<ConfirmDialog
  :open="showConfirm"
  title="Delete Quotation?"
  description="This action cannot be undone."
  confirm-label="Delete"
  variant="destructive"
  @confirm="handleDelete"
  @cancel="showConfirm = false"
/>
```

## Document Components (`@/components/document`)

### Inventory

| Component | Purpose |
|-----------|---------|
| `DocumentFormLayout` | Sidebar + main + footer form layout |
| `DocumentDetailLayout` | Header + actions + content detail layout |
| `ListPageContainer` | Standard list page wrapper |
| `LineItemsTable` | Line item rows with CRUD |
| `TotalsSummary` | Subtotal, tax, discount, grand total |
| `WorkflowActions` | Status transition buttons |

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
  <template #sidebar>
    <!-- Customer info, dates, etc. -->
  </template>
  <template #main>
    <!-- Line items, notes, etc. -->
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

### ListPageContainer

```vue
<ListPageContainer
  title="Quotations"
  subtitle="Manage customer quotations"
  :new-route="{ name: 'quotation-new' }"
  new-label="New Quotation"
>
  <!-- Filters and table -->
</ListPageContainer>
```

### WorkflowActions

```vue
<WorkflowActions
  :actions="availableActions"
  :is-transitioning="isTransitioning"
  @action="handleAction"
/>
```

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

## Domain Components

### Charts (`@/components/charts`)
- `BarChart` - Bar chart visualization
- `DoughnutChart` - Pie/doughnut chart
- `LineChart` - Line chart visualization
- `MonthlyBillChart` - Monthly billing chart
- `PaybackChart` - Solar payback visualization

### Projects (`@/components/projects`)
- `ProjectTaskModal` - Create/edit project task
- `ProjectTasksList` - Task list with status
- `ProjectCostModal` - Add project cost
- `ProjectCostsList` - Cost breakdown list
- `ProjectRevenueModal` - Add revenue entry
- `ProjectRevenuesList` - Revenue list

### Quotations (`@/components/quotations`)
- `CreateQuotationFromBomModal` - Create quotation from BOM
- `LogActivityModal` - Log CRM activity
- `ScheduleFollowUpModal` - Schedule follow-up

### Invoices (`@/components/invoices`)
- `ScheduleReminderModal` - Schedule payment reminder
- `SendReminderModal` - Send payment reminder

### Solar (`@/components/solar`)
- `BatteryConfigurator` - Battery setup
- `CapacityCalculatorModal` - Capacity calculator
- `FinancingCalculator` - Financing options
- `SolarSettingsPanel` - Settings panel
- `StatsCard` - Solar statistics
- `WhatIfScenarios` - Scenario comparisons
- `WizardStepIndicator` - Wizard step progress

### Maps (`@/components/maps`)
- `LocationMapPicker` - Map-based location picker

## Root-Level Components

| Component | Purpose |
|-----------|---------|
| `AttachmentCard` | File attachment display/management |
| `BulkActionsBar` | Bulk selection action bar |
| `CommandPalette` | Cmd+K command palette |
| `ErrorBoundary` | Error boundary wrapper |
| `GlobalSearch` | Global search component |
| `KeyboardShortcutsModal` | Keyboard shortcuts reference |
| `MobileBottomNav` | Mobile navigation bar |
| `NotificationDropdown` | Notification bell dropdown |
| `OfflineBanner` | Offline status banner |
| `PrintableDocument` | Print-optimized document wrapper |
| `PwaUpdatePrompt` | PWA update notification |
| `RecentlyViewed` | Recently viewed documents |
| `SessionTimeoutModal` | Session timeout warning |

## Page Patterns

### List Page Template
```vue
<template>
  <ListPageContainer
    title="Quotations"
    subtitle="Manage customer quotations"
    :new-route="{ name: 'quotation-new' }"
    new-label="New Quotation"
  >
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input v-model="filters.search" placeholder="Search..." />
      </FilterGroup>
      <FilterGroup min-width="150px">
        <Select v-model="filters.status" :options="statusOptions" />
      </FilterGroup>
    </FilterBar>

    <Card :padding="false">
      <ResponsiveTable
        :columns="columns"
        :data="items"
        :loading="isLoading"
        @row-click="(row) => router.push({ name: 'quotation-detail', params: { id: row.id } })"
      />
      <Pagination v-if="pagination" v-bind="pagination" @change="goToPage" />
    </Card>
  </ListPageContainer>
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
- Use `variant="primary"` -> use `variant="default"` or omit
- Use `variant="danger"` -> use `variant="destructive"`
- Create inline styles for common patterns
