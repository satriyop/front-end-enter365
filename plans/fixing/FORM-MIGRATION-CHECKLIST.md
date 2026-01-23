# Form Migration Checklist

> Use this checklist when refactoring a form page to use composables

## Pre-Migration

- [ ] Read the form page completely, understand all features
- [ ] Identify: line items? calculations? status workflow?
- [ ] Check if there's a validation schema in `src/utils/validation.ts`

---

## Migration Steps

### Step 1: Replace Form Setup

```typescript
// REMOVE this pattern:
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const { values: form, errors, handleSubmit, setValues, setErrors, validateField } = useForm({
  validationSchema: toTypedSchema(schema),
  initialValues: {...}
})

// REPLACE with:
import { useDocumentForm } from '@/composables'

const {
  form,
  errors,
  isEditing,
  isLoading,
  isSubmitting,
  handleSubmit,
  setValues,
  validateField,
} = useDocumentForm({
  schema: quotationSchema,
  resourceName: 'quotation',
  useDetailHook: useQuotation,
  useCreateHook: useCreateQuotation,
  useUpdateHook: useUpdateQuotation,
  getInitialValues: () => ({...}),
  transformForApi: (values) => ({...}),
  onSuccess: (result, isEdit) => {
    toast.success(isEdit ? 'Updated' : 'Created')
    router.push(`/quotations/${result.id}`)
  },
})
```

### Step 2: Replace Line Items (if applicable)

```typescript
// REMOVE this pattern:
const { fields: itemFields, push: pushItem, remove: removeItem } = useFieldArray('items')

function createEmptyItem() { return {...} }
function addItem() { pushItem(createEmptyItem()) }
function handleRemoveItem(index) { if (itemFields.value.length > 1) removeItem(index) }

// REPLACE with:
import { useLineItems } from '@/composables'

const {
  items: lineItems,
  addItem,
  removeItem,
  updateItem,
  canRemove,
} = useLineItems({
  formItems: () => form.items,
  setFormItems: (items) => { form.items = items },
  createEmptyItem: () => ({
    description: '',
    quantity: 1,
    unit: 'pcs',
    unit_price: 0,
  }),
  minItems: 1,
})
```

### Step 3: Replace Calculations (if applicable)

```typescript
// REMOVE all of these:
function calculateItemTotal(item) {...}
const subtotal = computed(() => items.reduce(...))
const discountAmount = computed(() => ...)
const taxAmount = computed(() => ...)
const grandTotal = computed(() => ...)

// REPLACE with:
import { useCalculation } from '@/services/calculation'

const { totals, getLineCalculation } = useCalculation(
  computed(() => form.items?.map(item => ({
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_type: 'percent',
    discount_value: item.discount_percent,
    tax_rate: item.tax_rate,
  })) ?? [])
)

// Use in template:
// {{ formatCurrency(totals.subtotal) }}
// {{ formatCurrency(totals.tax) }}
// {{ formatCurrency(totals.grandTotal) }}
// {{ formatCurrency(getLineCalculation(index)?.total) }}
```

### Step 4: Replace Native HTML Elements

**In line item tables:**

```vue
<!-- REMOVE native select -->
<select v-model="item.product_id" class="w-full px-2 py-1.5 rounded border...">

<!-- REPLACE with -->
<Select v-model="item.product_id" :options="productOptions" placeholder="Select product" />
```

```vue
<!-- REMOVE native input -->
<input v-model="item.description" type="text" class="w-full px-2 py-1.5..."/>

<!-- REPLACE with -->
<Input v-model="item.description" placeholder="Description" />
```

```vue
<!-- REMOVE native number input for currency -->
<input v-model.number="item.unit_price" type="number" min="0" class="..."/>

<!-- REPLACE with -->
<CurrencyInput v-model="item.unit_price" />
```

### Step 5: Replace Hardcoded CSS

Use find-replace in the file:

| Find | Replace |
|------|---------|
| `text-slate-900 dark:text-slate-100` | `text-foreground` |
| `text-slate-500 dark:text-slate-400` | `text-muted-foreground` |
| `text-slate-600 dark:text-slate-400` | `text-muted-foreground` |
| `bg-white dark:bg-slate-900` | `bg-background` |
| `bg-white dark:bg-slate-800` | `bg-card` |
| `border-slate-200 dark:border-slate-700` | `border-border` |
| `bg-slate-50 dark:bg-slate-800` | `bg-muted` |

---

## Post-Migration Testing

### Create Flow
- [ ] Page loads without errors
- [ ] Form validation shows errors correctly
- [ ] Line items can be added
- [ ] Line items can be removed (except last one)
- [ ] Calculations update reactively
- [ ] Submit creates document
- [ ] Redirects to detail page
- [ ] Toast shows success message

### Edit Flow
- [ ] Page loads existing data
- [ ] All fields populated correctly
- [ ] Line items load correctly
- [ ] Changes can be saved
- [ ] Redirects correctly after save

### Edge Cases
- [ ] Empty line item description filtered out on submit
- [ ] Product selection populates line item fields
- [ ] Date fields default correctly
- [ ] Discount calculations correct (percentage vs fixed)
- [ ] Tax calculations correct

---

## Common Gotchas

### 1. Type Mismatches
```typescript
// API returns strings, form expects numbers
contact_id: toNumber(data.contact_id),  // Use toNumber utility
```

### 2. Date Format
```typescript
// API returns ISO dates, inputs need YYYY-MM-DD
invoice_date: data.invoice_date.split('T')[0],
```

### 3. Optional Fields
```typescript
// Don't send empty strings, send undefined
notes: formValues.notes || undefined,
```

### 4. Nested Field Errors
```typescript
// VeeValidate nested: items.0.description
// Display: errors['items.0.description'] or errors.items
```

---

## Reference: Correct Imports

```typescript
// Composables
import { useDocumentForm, useLineItems } from '@/composables'

// Services
import { useCalculation } from '@/services/calculation'

// UI Components (use barrel import)
import {
  Button,
  Input,
  Select,
  Textarea,
  FormField,
  Card,
  Alert,
  CurrencyInput,
  useToast,
} from '@/components/ui'

// API hooks
import { useQuotation, useCreateQuotation, useUpdateQuotation } from '@/api/useQuotations'

// Utilities
import { formatCurrency, toNumber } from '@/utils/format'
```
