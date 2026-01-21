# Phase 4: Component Architecture

## Overview

This phase creates reusable UI components that work with the composables from Phase 3. These components dramatically reduce template duplication across pages.

**Prerequisites:** Phase 1, Phase 2, Phase 3

**Deliverables:**
1. `LineItemsTable` - universal line items table component
2. `DocumentFormLayout` - standard form page layout
3. `DocumentDetailLayout` - standard detail page layout
4. `ListPageContainer` - wrapper with built-in states
5. `StatusBadge` - enhanced with centralized registry
6. `ConfirmationModal` - reusable confirmation dialog

---

## 4.1 LineItemsTable Component

### The Problem

Every document form has a nearly identical line items table:
- Product selection column
- Description column
- Quantity, Unit, Unit Price columns
- Discount columns (type + value)
- Subtotal column
- Add/Remove buttons

**Current duplication:** ~150 lines per form page

### The Solution

```vue
<!-- src/components/document/LineItemsTable.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { BaseLineItem, LineItemCalculation } from '@/services/line-items'
import { Button, Input, Select } from '@/components/ui'
import { Plus, Trash2, GripVertical, Copy } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/format'

interface Props {
  items: BaseLineItem[]
  calculations?: LineItemCalculation[]
  productOptions?: Array<{ value: number; label: string; price?: number }>
  canAdd?: boolean
  canRemove?: boolean
  canReorder?: boolean
  canDuplicate?: boolean
  showTax?: boolean
  showDiscount?: boolean
  showProductSelect?: boolean
  disabled?: boolean
  errors?: Map<number, string[]>
}

const props = withDefaults(defineProps<Props>(), {
  calculations: () => [],
  productOptions: () => [],
  canAdd: true,
  canRemove: true,
  canReorder: false,
  canDuplicate: false,
  showTax: true,
  showDiscount: true,
  showProductSelect: true,
  disabled: false,
})

const emit = defineEmits<{
  add: [item?: Partial<BaseLineItem>]
  remove: [index: number]
  update: [index: number, field: keyof BaseLineItem, value: any]
  reorder: [fromIndex: number, toIndex: number]
  duplicate: [index: number]
  'product-selected': [index: number, productId: number]
}>()

// Discount type options
const discountTypeOptions = [
  { value: '', label: 'None' },
  { value: 'percent', label: '%' },
  { value: 'amount', label: 'Rp' },
]

// Get calculation for specific line
function getCalculation(index: number): LineItemCalculation | null {
  return props.calculations[index] ?? null
}

// Get error for specific line
function getError(index: number): string | null {
  const errors = props.errors?.get(index)
  return errors?.[0] ?? null
}

// Handle product selection
function handleProductSelect(index: number, productId: number | null) {
  emit('update', index, 'product_id', productId)

  if (productId) {
    emit('product-selected', index, productId)

    // Auto-fill price from product options
    const product = props.productOptions.find((p) => p.value === productId)
    if (product?.price) {
      emit('update', index, 'unit_price', product.price)
    }
  }
}

// Handle field update
function handleUpdate(index: number, field: keyof BaseLineItem, event: Event) {
  const target = event.target as HTMLInputElement
  let value: any = target.value

  // Convert numeric fields
  if (['quantity', 'unit_price', 'discount_value'].includes(field)) {
    value = parseFloat(value) || 0
  }

  emit('update', index, field, value)
}

// Column visibility
const showProductColumn = computed(() => props.showProductSelect)
const showDiscountColumn = computed(() => props.showDiscount)
const showTaxColumn = computed(() => props.showTax)
</script>

<template>
  <div class="space-y-4">
    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b bg-muted/50">
          <tr>
            <th v-if="canReorder" class="w-10 px-2 py-2"></th>
            <th v-if="showProductColumn" class="px-3 py-2 text-left font-medium">Product</th>
            <th class="px-3 py-2 text-left font-medium">Description</th>
            <th class="w-20 px-3 py-2 text-right font-medium">Qty</th>
            <th class="w-20 px-3 py-2 text-left font-medium">Unit</th>
            <th class="w-32 px-3 py-2 text-right font-medium">Unit Price</th>
            <th v-if="showDiscountColumn" class="w-28 px-3 py-2 text-right font-medium">Discount</th>
            <th class="w-32 px-3 py-2 text-right font-medium">Subtotal</th>
            <th class="w-20 px-2 py-2"></th>
          </tr>
        </thead>

        <tbody class="divide-y">
          <tr
            v-for="(item, index) in items"
            :key="index"
            :class="{ 'bg-destructive/5': getError(index) }"
          >
            <!-- Drag handle -->
            <td v-if="canReorder" class="px-2 py-2">
              <button
                type="button"
                class="cursor-grab text-muted-foreground hover:text-foreground"
                :disabled="disabled"
              >
                <GripVertical class="h-4 w-4" />
              </button>
            </td>

            <!-- Product select -->
            <td v-if="showProductColumn" class="px-3 py-2">
              <Select
                :model-value="item.product_id ?? ''"
                :options="productOptions"
                placeholder="Select product"
                :disabled="disabled"
                class="w-full min-w-[150px]"
                @update:model-value="handleProductSelect(index, $event)"
              />
            </td>

            <!-- Description -->
            <td class="px-3 py-2">
              <Input
                :model-value="item.description"
                placeholder="Description"
                :disabled="disabled"
                class="w-full min-w-[200px]"
                @input="handleUpdate(index, 'description', $event)"
              />
            </td>

            <!-- Quantity -->
            <td class="px-3 py-2">
              <Input
                type="number"
                :model-value="item.quantity"
                min="0"
                step="1"
                :disabled="disabled"
                class="w-full text-right"
                @input="handleUpdate(index, 'quantity', $event)"
              />
            </td>

            <!-- Unit -->
            <td class="px-3 py-2">
              <Input
                :model-value="item.unit"
                placeholder="pcs"
                :disabled="disabled"
                class="w-full"
                @input="handleUpdate(index, 'unit', $event)"
              />
            </td>

            <!-- Unit Price -->
            <td class="px-3 py-2">
              <Input
                type="number"
                :model-value="item.unit_price"
                min="0"
                :disabled="disabled"
                class="w-full text-right"
                @input="handleUpdate(index, 'unit_price', $event)"
              />
            </td>

            <!-- Discount -->
            <td v-if="showDiscountColumn" class="px-3 py-2">
              <div class="flex gap-1">
                <Select
                  :model-value="item.discount_type ?? ''"
                  :options="discountTypeOptions"
                  :disabled="disabled"
                  class="w-16"
                  @update:model-value="emit('update', index, 'discount_type', $event || null)"
                />
                <Input
                  v-if="item.discount_type"
                  type="number"
                  :model-value="item.discount_value"
                  min="0"
                  :disabled="disabled"
                  class="w-20 text-right"
                  @input="handleUpdate(index, 'discount_value', $event)"
                />
              </div>
            </td>

            <!-- Subtotal (calculated) -->
            <td class="px-3 py-2 text-right font-medium">
              {{ formatCurrency(getCalculation(index)?.total ?? 0) }}
            </td>

            <!-- Actions -->
            <td class="px-2 py-2">
              <div class="flex gap-1">
                <Button
                  v-if="canDuplicate"
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :disabled="disabled"
                  @click="emit('duplicate', index)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
                <Button
                  v-if="canRemove"
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :disabled="disabled || items.length <= 1"
                  @click="emit('remove', index)"
                >
                  <Trash2 class="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="items.length === 0">
            <td
              :colspan="6 + (showProductColumn ? 1 : 0) + (showDiscountColumn ? 1 : 0) + (canReorder ? 1 : 0)"
              class="px-3 py-8 text-center text-muted-foreground"
            >
              No items added yet. Click "Add Item" to get started.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add button -->
    <div v-if="canAdd" class="flex justify-start">
      <Button
        type="button"
        variant="outline"
        :disabled="disabled"
        @click="emit('add')"
      >
        <Plus class="h-4 w-4 mr-2" />
        Add Item
      </Button>
    </div>

    <!-- Error display -->
    <slot name="errors" :errors="errors" />
  </div>
</template>
```

### Usage

```vue
<LineItemsTable
  :items="items"
  :calculations="lineCalculations"
  :product-options="productLookup"
  :errors="itemErrors"
  @add="addItem"
  @remove="removeItem"
  @update="updateItem"
  @product-selected="handleProductSelected"
/>
```

---

## 4.2 DocumentFormLayout Component

### The Problem

Form pages share common structure:
- Header with title and action buttons
- Form sections (header fields, line items, notes)
- Totals summary
- Sticky footer with submit/cancel buttons
- Loading overlay

### The Solution

```vue
<!-- src/components/document/DocumentFormLayout.vue -->
<script setup lang="ts">
import { Button, Card } from '@/components/ui'
import { Loader2 } from 'lucide-vue-next'

interface Props {
  title: string
  subtitle?: string
  isLoading?: boolean
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
  showCancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isSubmitting: false,
  submitLabel: 'Save',
  cancelLabel: 'Cancel',
  showCancel: true,
})

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

function handleSubmit() {
  emit('submit')
}
</script>

<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-50 flex items-center justify-center bg-background/80"
    >
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold">{{ title }}</h1>
            <p v-if="subtitle" class="text-muted-foreground">{{ subtitle }}</p>
          </div>
          <slot name="header-actions" />
        </div>
      </div>

      <!-- Main content -->
      <div class="space-y-6">
        <!-- Header fields section -->
        <Card v-if="$slots.header">
          <div class="p-6">
            <slot name="header" />
          </div>
        </Card>

        <!-- Line items section -->
        <Card v-if="$slots.items">
          <div class="p-6">
            <h2 class="text-lg font-medium mb-4">Items</h2>
            <slot name="items" />
          </div>
        </Card>

        <!-- Additional sections -->
        <slot name="sections" />

        <!-- Notes and totals -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Notes -->
          <Card v-if="$slots.notes">
            <div class="p-6">
              <h2 class="text-lg font-medium mb-4">Notes</h2>
              <slot name="notes" />
            </div>
          </Card>

          <!-- Totals -->
          <Card v-if="$slots.totals">
            <div class="p-6">
              <h2 class="text-lg font-medium mb-4">Summary</h2>
              <slot name="totals" />
            </div>
          </Card>
        </div>
      </div>

      <!-- Footer (sticky on mobile) -->
      <div class="sticky bottom-0 mt-6 -mx-4 px-4 py-4 bg-background border-t lg:static lg:mx-0 lg:px-0 lg:border-0">
        <div class="flex justify-end gap-3">
          <Button
            v-if="showCancel"
            type="button"
            variant="outline"
            :disabled="isSubmitting"
            @click="emit('cancel')"
          >
            {{ cancelLabel }}
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            {{ submitLabel }}
          </Button>
        </div>
      </div>
    </form>
  </div>
</template>
```

---

## 4.3 DocumentDetailLayout Component

### The Problem

Detail pages share common structure:
- Header with document number, status, actions
- Main content (two-column grid)
- Sidebar with summary
- Action buttons based on status
- Print preview

### The Solution

```vue
<!-- src/components/document/DocumentDetailLayout.vue -->
<script setup lang="ts">
import { Badge, Button, Card } from '@/components/ui'
import type { WorkflowAction } from '@/composables/useDocumentWorkflow'
import { Printer, Edit, ChevronLeft, Loader2 } from 'lucide-vue-next'

interface Props {
  title: string
  documentNumber: string
  status: string
  statusVariant?: string
  isLoading?: boolean
  isProcessing?: boolean
  showPrint?: boolean
  showEdit?: boolean
  editRoute?: string
}

const props = withDefaults(defineProps<Props>(), {
  statusVariant: 'secondary',
  isLoading: false,
  isProcessing: false,
  showPrint: true,
  showEdit: true,
})

const emit = defineEmits<{
  back: []
  edit: []
  print: []
  action: [actionName: string]
}>()
</script>

<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-50 flex items-center justify-center bg-background/80"
    >
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="emit('back')">
            <ChevronLeft class="h-5 w-5" />
          </Button>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold">{{ title }}</h1>
              <Badge :variant="statusVariant">{{ status }}</Badge>
            </div>
            <p class="text-muted-foreground">{{ documentNumber }}</p>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2">
          <!-- Workflow actions -->
          <slot name="actions" :is-processing="isProcessing" />

          <!-- Standard actions -->
          <Button
            v-if="showPrint"
            variant="outline"
            @click="emit('print')"
          >
            <Printer class="h-4 w-4 mr-2" />
            Print
          </Button>

          <Button
            v-if="showEdit"
            variant="outline"
            @click="emit('edit')"
          >
            <Edit class="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content (2 columns) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Info section -->
        <Card v-if="$slots.info">
          <div class="p-6">
            <slot name="info" />
          </div>
        </Card>

        <!-- Items section -->
        <Card v-if="$slots.items">
          <div class="p-6">
            <h2 class="text-lg font-medium mb-4">Items</h2>
            <slot name="items" />
          </div>
        </Card>

        <!-- Additional sections -->
        <slot name="main" />
      </div>

      <!-- Sidebar (1 column) -->
      <div class="space-y-6">
        <!-- Summary -->
        <Card v-if="$slots.summary">
          <div class="p-6">
            <h2 class="text-lg font-medium mb-4">Summary</h2>
            <slot name="summary" />
          </div>
        </Card>

        <!-- Activity / History -->
        <Card v-if="$slots.activity">
          <div class="p-6">
            <h2 class="text-lg font-medium mb-4">Activity</h2>
            <slot name="activity" />
          </div>
        </Card>

        <!-- Sidebar slots -->
        <slot name="sidebar" />
      </div>
    </div>

    <!-- Modals -->
    <slot name="modals" />
  </div>
</template>
```

---

## 4.4 ListPageContainer Component

### The Problem

List pages have identical loading/error/empty states that are inconsistently styled.

### The Solution

```vue
<!-- src/components/document/ListPageContainer.vue -->
<script setup lang="ts">
import { Button, Card } from '@/components/ui'
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-vue-next'

interface Props {
  isLoading?: boolean
  isRefreshing?: boolean
  showEmpty?: boolean
  showError?: boolean
  showData?: boolean
  error?: Error | null
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: any
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isRefreshing: false,
  showEmpty: false,
  showError: false,
  showData: true,
  emptyTitle: 'No items found',
  emptyDescription: 'Get started by creating a new item.',
})

const emit = defineEmits<{
  retry: []
  create: []
}>()
</script>

<template>
  <div class="relative">
    <!-- Refresh indicator -->
    <div
      v-if="isRefreshing && !isLoading"
      class="absolute top-0 left-0 right-0 z-10 flex justify-center"
    >
      <div class="bg-primary text-primary-foreground px-3 py-1 rounded-b-lg text-sm flex items-center gap-2">
        <Loader2 class="h-3 w-3 animate-spin" />
        Refreshing...
      </div>
    </div>

    <!-- Loading state -->
    <Card v-if="isLoading" class="p-12">
      <div class="flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 class="h-8 w-8 animate-spin mb-4" />
        <p>Loading...</p>
      </div>
    </Card>

    <!-- Error state -->
    <Card v-else-if="showError" class="p-12">
      <div class="flex flex-col items-center justify-center text-center">
        <AlertCircle class="h-12 w-12 text-destructive mb-4" />
        <h3 class="text-lg font-medium mb-2">Failed to load data</h3>
        <p class="text-muted-foreground mb-4 max-w-md">
          {{ error?.message || 'An unexpected error occurred. Please try again.' }}
        </p>
        <Button variant="outline" @click="emit('retry')">
          <RefreshCw class="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </Card>

    <!-- Empty state -->
    <Card v-else-if="showEmpty" class="p-12">
      <div class="flex flex-col items-center justify-center text-center">
        <component
          :is="emptyIcon || Inbox"
          class="h-12 w-12 text-muted-foreground mb-4"
        />
        <h3 class="text-lg font-medium mb-2">{{ emptyTitle }}</h3>
        <p class="text-muted-foreground mb-4 max-w-md">
          {{ emptyDescription }}
        </p>
        <slot name="empty-action">
          <Button @click="emit('create')">
            Create New
          </Button>
        </slot>
      </div>
    </Card>

    <!-- Data state -->
    <template v-else-if="showData">
      <slot />
    </template>
  </div>
</template>
```

### Usage

```vue
<ListPageContainer
  :is-loading="isLoading"
  :show-empty="isEmpty"
  :show-error="hasError"
  :show-data="showData"
  :error="error"
  empty-title="No quotations yet"
  empty-description="Create your first quotation to get started."
  @retry="refresh"
  @create="$router.push({ name: 'quotation-new' })"
>
  <ResponsiveTable :items="items" :columns="columns">
    <!-- ... -->
  </ResponsiveTable>
</ListPageContainer>
```

---

## 4.5 Enhanced StatusBadge

```vue
<!-- src/components/ui/StatusBadge.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui'
import { statusService } from '@/services/status'
import type { DocumentStatusRegistry } from '@/services/status'

type DocumentType = keyof DocumentStatusRegistry

interface Props {
  documentType: DocumentType
  status: string
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: false,
})

const statusConfig = computed(() =>
  statusService.getStatus(props.documentType, props.status)
)
</script>

<template>
  <Badge :variant="statusConfig.variant">
    <component
      v-if="showIcon && statusConfig.icon"
      :is="statusConfig.icon"
      class="h-3 w-3 mr-1"
    />
    {{ statusConfig.label }}
  </Badge>
</template>
```

### Usage

```vue
<!-- Before -->
<Badge :variant="getStatusVariant(item.status)">
  {{ getStatusLabel(item.status) }}
</Badge>

<!-- After -->
<StatusBadge document-type="quotation" :status="item.status" />
```

---

## 4.6 TotalsSummary Component

```vue
<!-- src/components/document/TotalsSummary.vue -->
<script setup lang="ts">
import { formatCurrency } from '@/utils/format'
import type { DocumentTotals } from '@/services/calculation'

interface Props {
  totals: DocumentTotals
  showDiscount?: boolean
  showTax?: boolean
  showTaxRate?: boolean
  taxRate?: number
  currency?: string
}

const props = withDefaults(defineProps<Props>(), {
  showDiscount: true,
  showTax: true,
  showTaxRate: true,
  taxRate: 11,
  currency: 'IDR',
})
</script>

<template>
  <div class="space-y-2 text-sm">
    <div class="flex justify-between">
      <span class="text-muted-foreground">Subtotal</span>
      <span>{{ formatCurrency(totals.subtotal) }}</span>
    </div>

    <div v-if="showDiscount && totals.totalDiscount > 0" class="flex justify-between text-destructive">
      <span>Discount</span>
      <span>-{{ formatCurrency(totals.totalDiscount) }}</span>
    </div>

    <div v-if="showTax" class="flex justify-between">
      <span class="text-muted-foreground">
        Tax
        <span v-if="showTaxRate">({{ taxRate }}%)</span>
      </span>
      <span>{{ formatCurrency(totals.tax) }}</span>
    </div>

    <div class="flex justify-between pt-2 border-t font-semibold text-base">
      <span>Grand Total</span>
      <span class="text-primary">{{ formatCurrency(totals.grandTotal) }}</span>
    </div>
  </div>
</template>
```

---

## 4.7 ConfirmationModal Component

```vue
<!-- src/components/ui/ConfirmationModal.vue -->
<script setup lang="ts">
import { Modal, Button } from '@/components/ui'
import { AlertTriangle, Loader2 } from 'lucide-vue-next'

interface Props {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive' | 'warning'
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
  isLoading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

const confirmVariant = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'destructive'
    case 'warning':
      return 'warning'
    default:
      return 'default'
  }
})
</script>

<template>
  <Modal
    :open="open"
    :title="title"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <div class="flex gap-4">
        <AlertTriangle
          v-if="variant !== 'default'"
          :class="[
            'h-6 w-6 flex-shrink-0',
            variant === 'destructive' ? 'text-destructive' : 'text-warning'
          ]"
        />
        <p class="text-muted-foreground">{{ message }}</p>
      </div>

      <div class="flex justify-end gap-3">
        <Button
          variant="outline"
          :disabled="isLoading"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </Button>
        <Button
          :variant="confirmVariant"
          :disabled="isLoading"
          @click="emit('confirm')"
        >
          <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
          {{ confirmLabel }}
        </Button>
      </div>
    </div>
  </Modal>
</template>
```

---

## 4.8 File Structure

```
src/components/
├── document/
│   ├── index.ts
│   ├── LineItemsTable.vue
│   ├── DocumentFormLayout.vue
│   ├── DocumentDetailLayout.vue
│   ├── ListPageContainer.vue
│   ├── TotalsSummary.vue
│   └── WorkflowActions.vue
│
├── ui/
│   ├── ... (existing)
│   ├── StatusBadge.vue
│   └── ConfirmationModal.vue
```

---

## Migration Example

### Before: QuotationFormPage.vue (~500 lines)

```vue
<template>
  <div class="space-y-6">
    <!-- 30 lines of header -->
    <!-- 100 lines of form fields -->
    <!-- 150 lines of line items table -->
    <!-- 50 lines of totals -->
    <!-- 30 lines of footer -->
    <!-- 50 lines of modals -->
  </div>
</template>

<script setup lang="ts">
// 200+ lines of script
</script>
```

### After: QuotationFormPage.vue (~120 lines)

```vue
<template>
  <DocumentFormLayout
    :title="isEditMode ? 'Edit Quotation' : 'New Quotation'"
    :is-loading="isLoadingData"
    :is-submitting="isSubmitting"
    @submit="submit"
    @cancel="$router.back()"
  >
    <template #header>
      <div class="grid grid-cols-2 gap-4">
        <FormField label="Contact" :error="errors.contact_id">
          <ContactSelect v-model="values.contact_id" />
        </FormField>
        <FormField label="Date" :error="errors.date">
          <Input type="date" v-model="values.date" />
        </FormField>
      </div>
    </template>

    <template #items>
      <LineItemsTable
        :items="items"
        :calculations="lineCalculations"
        :product-options="productOptions"
        @add="addItem"
        @remove="removeItem"
        @update="updateItem"
      />
    </template>

    <template #totals>
      <TotalsSummary :totals="totals" />
    </template>
  </DocumentFormLayout>
</template>

<script setup lang="ts">
import { useDocumentForm } from '@/composables/useDocumentForm'
import { useLineItems } from '@/composables/useLineItems'
import { DocumentFormLayout, LineItemsTable, TotalsSummary } from '@/components/document'
import { quotationSchema } from '@/utils/validation'

// ~60 lines of clean, focused script
</script>
```

**Reduction: ~380 lines (76% less code)**

---

## Checklist

- [ ] LineItemsTable component
- [ ] DocumentFormLayout component
- [ ] DocumentDetailLayout component
- [ ] ListPageContainer component
- [ ] StatusBadge with registry integration
- [ ] TotalsSummary component
- [ ] ConfirmationModal component
- [ ] WorkflowActions component
- [ ] Component documentation/examples
- [ ] Migrate at least 2 pages to new components

---

## Next Phase

Once Phase 4 is complete, proceed to [Phase 5: Strategy Pattern Implementation](./05-PHASE-STRATEGY-PATTERN.md) for export strategies and other pluggable behaviors.
