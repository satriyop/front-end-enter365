# Enter365 Composables

## Overview

Composables encapsulate reusable Vue composition logic. They reduce boilerplate in pages by ~70%.

Location: `src/composables/`

## Composable Inventory

### Core Composables (directory-based)

| Composable | Purpose | Used In |
|------------|---------|---------|
| `useDocumentForm` | Form state, validation, submission | Form pages |
| `useLineItems` | Line item CRUD with calculations | Document forms |
| `useDocumentWorkflow` | State machine integration (6 workflows) | Detail pages |
| `useResourceList` | List filtering, pagination, search | List pages |
| `useResourceDetail` | Single resource CRUD | Detail pages |

### Root-Level Composables (21 total)

| Composable | Purpose |
|------------|---------|
| `useAutosave` | Auto-save form data with debounce |
| `useBatteryCalculator` | Solar battery sizing calculations |
| `useBulkSelection` | Multi-select with actions |
| `useClipboard` | Copy to clipboard |
| `useDarkMode` | Dark/light theme toggle |
| `useDragAndDrop` | Drag and drop reordering |
| `useFilterPresets` | Save/load filter configurations |
| `useFinancingCalculator` | Solar financing calculations |
| `useFormShortcuts` | Form keyboard shortcuts (Ctrl+S, etc.) |
| `useGeocoding` | Address geocoding for maps |
| `useKeyboardShortcuts` | Global keyboard shortcuts |
| `useNotifications` | Browser notification integration |
| `useOnlineStatus` | Online/offline detection |
| `usePrint` | Print document functionality |
| `usePullToRefresh` | Mobile pull-to-refresh |
| `useRecentlyViewed` | Track recently viewed documents |
| `useScenarioCalculator` | Solar what-if scenarios |
| `useSessionTimeout` | Session timeout with warning |
| `useUnsavedChanges` | Warn before navigation with unsaved changes |
| `useValidatedForm` | Form validation with Zod schemas |
| `useWebSocket` | WebSocket connection management |

## useDocumentForm

### Purpose
Manages document form state, validation, and submission with automatic dirty tracking.

### Usage
```typescript
import { useDocumentForm } from '@/composables'

const {
  form,
  errors,
  isDirty,
  isSubmitting,
  handleSubmit,
  reset,
  setFieldValue,
} = useDocumentForm<QuotationFormData>({
  initialData: {
    contact_id: null,
    date: new Date().toISOString().split('T')[0],
    valid_until: null,
    notes: '',
    items: [],
  },
  validationSchema: quotationSchema,
  onSubmit: async (data) => {
    if (isEditing) {
      await updateQuotation.mutateAsync({ id, ...data })
    } else {
      await createQuotation.mutateAsync(data)
    }
    router.push({ name: 'quotations' })
  },
})
```

### Config & Return Types
```typescript
interface DocumentFormConfig<T> {
  initialData: T
  validationSchema?: ZodSchema<T>
  onSubmit: (data: T) => Promise<void>
  onError?: (error: Error) => void
  validateOnChange?: boolean  // default: true
  validateOnBlur?: boolean    // default: true
}

interface DocumentFormReturn<T> {
  form: Ref<T>
  errors: Ref<ValidationErrors>
  isDirty: ComputedRef<boolean>
  isSubmitting: Ref<boolean>
  isValid: ComputedRef<boolean>
  handleSubmit: () => Promise<void>
  reset: (data?: T) => void
  setFieldValue: (field: keyof T, value: any) => void
  setFieldError: (field: keyof T, error: string) => void
  clearErrors: () => void
}
```

## useLineItems

### Purpose
Manages line items with automatic calculations and validation.

### Usage
```typescript
import { useLineItems } from '@/composables'

const {
  items,
  calculations,
  totals,
  addItem,
  removeItem,
  updateItem,
  duplicateItem,
  reorderItems,
  errors,
} = useLineItems({
  initialItems: quotation.value?.items ?? [],
  calculationConfig: {
    taxStrategy: new PPNStrategy(),
    discountStrategy: new PercentDiscountStrategy(),
  },
  minItems: 1,
  maxItems: 100,
  onItemsChange: (items) => {
    form.value.items = items
  },
})
```

### Options & Return Types
```typescript
interface UseLineItemsOptions {
  initialItems?: BaseLineItem[]
  calculationConfig?: CalculationConfig
  minItems?: number           // default: 0
  maxItems?: number           // default: Infinity
  onItemsChange?: (items: BaseLineItem[]) => void
  validateItem?: (item: BaseLineItem) => string[]
}

interface UseLineItemsReturn {
  items: Ref<BaseLineItem[]>
  calculations: ComputedRef<LineItemCalculation[]>
  totals: ComputedRef<DocumentTotals>
  errors: ComputedRef<Map<number, string[]>>
  addItem: (item?: Partial<BaseLineItem>) => void
  removeItem: (index: number) => void
  updateItem: (index: number, updates: Partial<BaseLineItem>) => void
  duplicateItem: (index: number) => void
  reorderItems: (fromIndex: number, toIndex: number) => void
  clearItems: () => void
  setItems: (items: BaseLineItem[]) => void
}
```

## useDocumentWorkflow

### Purpose
Integrates state machine for document status transitions.

### Available Workflows (6)
```typescript
import {
  quotationWorkflow,
  invoiceWorkflow,
  billWorkflow,
  purchaseOrderWorkflow,
  workOrderWorkflow,
  solarProposalWorkflow,
} from '@/composables'
```

| Workflow | States |
|----------|--------|
| `quotationWorkflow` | draft -> pending -> approved/rejected -> converted |
| `invoiceWorkflow` | draft -> sent -> paid/overdue -> paid |
| `billWorkflow` | draft -> pending -> approved -> paid |
| `purchaseOrderWorkflow` | draft -> sent -> partial/received |
| `workOrderWorkflow` | draft -> in_progress -> completed/cancelled |
| `solarProposalWorkflow` | draft -> submitted -> review -> approved/rejected |

### Usage
```typescript
import { useDocumentWorkflow } from '@/composables'

const {
  currentState,
  canTransition,
  availableTransitions,
  transition,
  isTransitioning,
} = useDocumentWorkflow({
  workflow: 'quotation',
  initialState: quotation.value?.status ?? 'draft',
  context: { documentId: id },
  onTransition: async (from, to, context) => {
    await updateStatus.mutateAsync({ id: context.documentId, status: to })
  },
})

// In template
<Button
  v-for="action in availableTransitions"
  :key="action"
  @click="transition(action)"
  :disabled="isTransitioning"
>
  {{ action }}
</Button>
```

### Config & Return Types
```typescript
interface WorkflowConfig {
  workflow: string
  initialState: string
  context?: Record<string, any>
  onTransition?: (from: string, to: string, context: any) => Promise<void>
}

interface WorkflowReturn {
  currentState: Ref<string>
  canTransition: (event: string) => boolean
  availableTransitions: ComputedRef<string[]>
  transition: (event: string) => Promise<void>
  isTransitioning: Ref<boolean>
}
```

## useResourceList

### Purpose
Manages list pages with filtering, sorting, pagination. Filters auto-sync with URL query params.

### Usage
```typescript
import { useResourceList } from '@/composables'

const {
  items,
  filters,
  pagination,
  isLoading,
  error,
  refetch,
  updateFilters,
  resetFilters,
  goToPage,
} = useResourceList({
  queryKey: ['quotations'],
  queryFn: (params) => api.get('/quotations', { params }),
  defaultFilters: {
    search: '',
    status: '',
    date_from: '',
    date_to: '',
  },
  defaultSort: { field: 'created_at', order: 'desc' },
})
```

### Options & Return Types
```typescript
interface UseResourceListOptions<T, F> {
  queryKey: string[]
  queryFn: (params: ListParams<F>) => Promise<PaginatedResponse<T>>
  defaultFilters?: F
  defaultSort?: { field: string; order: 'asc' | 'desc' }
  perPage?: number           // default: 15
  syncWithUrl?: boolean      // default: true
  debounceMs?: number        // default: 300
}

// Exported types
type BaseFilters, PaginationMeta, PaginatedResponse,
     DeleteConfirmation, ResourceId
```

## useResourceDetail

### Purpose
Manages single resource fetching, updating, deleting.

### Usage
```typescript
import { useResourceDetail } from '@/composables'

const {
  data,
  isLoading,
  error,
  update,
  remove,
  refetch,
} = useResourceDetail({
  queryKey: ['quotations', id],
  queryFn: () => api.get(`/quotations/${id}`),
  updateFn: (data) => api.patch(`/quotations/${id}`, data),
  deleteFn: () => api.delete(`/quotations/${id}`),
  onDeleteSuccess: () => router.push({ name: 'quotations' }),
})
```

## Composable Structure Convention

```
src/composables/{composable-name}/
├── index.ts                 # Barrel export
├── {composableName}.ts      # Main implementation
├── types.ts                 # TypeScript interfaces
└── __tests__/
    └── {composableName}.test.ts
```

Root-level composables are single files: `src/composables/useMyComposable.ts`

### Template
```typescript
// src/composables/useMyComposable/useMyComposable.ts
import { ref, computed } from 'vue'
import type { MyOptions, MyReturn } from './types'

export function useMyComposable(options: MyOptions): MyReturn {
  // State
  const data = ref<Data>(options.initialData)
  const isLoading = ref(false)

  // Computed
  const isEmpty = computed(() => data.value.length === 0)

  // Methods
  function doSomething() {
    // ...
  }

  return {
    data,
    isLoading,
    isEmpty,
    doSomething,
  }
}

// src/composables/useMyComposable/index.ts
export { useMyComposable } from './useMyComposable'
export type * from './types'
```

## Best Practices

1. **Single Responsibility**: Each composable does ONE thing well
2. **Return Object**: Always return an object (not array) for named destructuring
3. **Refs vs Computed**: Use `ref` for mutable state, `computed` for derived
4. **Options Object**: Use options object for >2 parameters
5. **Type Everything**: Full TypeScript types for options and returns
6. **Test Coverage**: Unit tests for all composables
