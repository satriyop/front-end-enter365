# Refactoring Priority Plan

> Generated from code review on 2026-01-21

## Executive Summary

| Issue | Severity | Effort | Files Affected |
|-------|----------|--------|----------------|
| CSS Inconsistency | High | Medium | 96 pages |
| Unused Composables | High | High | ~15 form pages |
| Native HTML Elements | Medium | Medium | ~10 form pages |

---

## Priority 1: Form Pages - Adopt Existing Composables

**Why First:** Highest ROI. You already built `useDocumentForm`, `useLineItems`, `useCalculation` - they just need adoption. Fixes calculation duplication AND native HTML issues in one pass.

### Target Files (15 form pages)

| Page | Priority | Complexity |
|------|----------|------------|
| `QuotationFormPage.vue` | P0 | High - most complex |
| `InvoiceFormPage.vue` | P0 | Medium |
| `BillFormPage.vue` | P0 | Medium |
| `PurchaseOrderFormPage.vue` | P1 | High |
| `ContactFormPage.vue` | P1 | Low |
| `ProductFormPage.vue` | P1 | Low |
| `ProjectFormPage.vue` | P2 | Low |
| `PaymentFormPage.vue` | P2 | Medium |
| `WorkOrderFormPage.vue` | P2 | Medium |
| `JournalEntryFormPage.vue` | P2 | High |
| `AccountFormPage.vue` | P3 | Low |
| `FiscalPeriodFormPage.vue` | P3 | Low |
| `MaterialRequisitionFormPage.vue` | P3 | Medium |
| `SubcontractorWorkOrderFormPage.vue` | P3 | Medium |
| `CompanyProfileFormPage.vue` | P3 | Low |

### Migration Pattern

**Before (current):**
```vue
<script setup lang="ts">
import { useForm, useFieldArray } from 'vee-validate'
// ... 50+ lines of manual setup

const { values: form, errors, handleSubmit, setValues } = useForm({...})
const { fields: itemFields, push: pushItem, remove: removeItem } = useFieldArray('items')

// Duplicated calculation logic
function calculateItemTotal(item) {
  const gross = (item.quantity || 0) * (item.unit_price || 0)
  // ... more duplication
}

const subtotal = computed(() => /* duplicated */)
const taxAmount = computed(() => /* duplicated */)
</script>
```

**After (target):**
```vue
<script setup lang="ts">
import { useDocumentForm } from '@/composables'
import { useCalculation } from '@/services/calculation'

const {
  form,
  errors,
  isEditing,
  isSubmitting,
  handleSubmit,
  lineItems,
} = useDocumentForm({
  schema: quotationSchema,
  useDetailHook: useQuotation,
  useCreateHook: useCreateQuotation,
  useUpdateHook: useUpdateQuotation,
  // ...config
})

// Use centralized calculation
const { totals, getLineCalculation } = useCalculation(lineItems)
</script>
```

### Step-by-Step for Each Form

1. **Read** the existing composables:
   - `src/composables/useDocumentForm/useDocumentForm.ts`
   - `src/composables/useLineItems/useLineItems.ts`
   - `src/services/calculation/useCalculation.ts`

2. **Refactor** in this order per file:
   - [ ] Replace VeeValidate setup with `useDocumentForm`
   - [ ] Replace manual line items with `useLineItems`
   - [ ] Replace calculation functions with `useCalculation`
   - [ ] Replace native `<input>`/`<select>` with UI components
   - [ ] Replace hardcoded colors with semantic tokens

3. **Test** each form:
   - [ ] Create new document
   - [ ] Edit existing document
   - [ ] Line item add/remove
   - [ ] Calculations correct
   - [ ] Validation errors display

### Estimated Effort

| Form Complexity | Time per Form |
|-----------------|---------------|
| Low (Contact, Product) | 1-2 hours |
| Medium (Invoice, Bill) | 2-4 hours |
| High (Quotation, PO) | 4-6 hours |

**Total: ~40-60 hours** for all 15 forms

---

## Priority 2: CSS Design Token Migration

**Why Second:** Can be done incrementally, file by file, even during other work.

### Strategy: Gradual Migration

**Do NOT** attempt a global find-replace. Instead:

1. **Create a lint rule** (eslint or stylelint) to warn on hardcoded colors
2. **Fix during touch** - when editing any file, migrate that file's CSS
3. **Batch by module** - pick one module, migrate all its pages

### Token Mapping Reference

| Hardcoded | Semantic Token |
|-----------|----------------|
| `text-slate-900 dark:text-slate-100` | `text-foreground` |
| `text-slate-500 dark:text-slate-400` | `text-muted-foreground` |
| `text-slate-600 dark:text-slate-400` | `text-muted-foreground` |
| `bg-white dark:bg-slate-900` | `bg-background` |
| `bg-white dark:bg-slate-800` | `bg-card` |
| `border-slate-200 dark:border-slate-700` | `border-border` |
| `text-red-500` | `text-destructive` |
| `text-orange-600 dark:text-orange-400` | `text-primary` |

### Module-by-Module Plan

| Module | Files | Priority |
|--------|-------|----------|
| `pages/quotations/` | 3 | P0 (touch during form refactor) |
| `pages/invoices/` | 3 | P0 |
| `pages/bills/` | 3 | P0 |
| `pages/contacts/` | 3 | P1 |
| `pages/products/` | 3 | P1 |
| `pages/purchasing/` | 9 | P2 |
| `pages/sales/` | 6 | P2 |
| `pages/accounting/` | 9 | P2 |
| `pages/manufacturing/` | 9 | P3 |
| `pages/reports/` | 15 | P3 |
| `pages/settings/` | 12 | P3 |

### Quick Win: Shared Components

These affect ALL pages - fix once, benefit everywhere:

```
src/components/ui/Card.vue
src/components/ui/FilterBar.vue
src/components/ui/DataTable.vue
src/components/ui/Modal.vue
```

---

## Priority 3: Native HTML Element Replacement

**Why Third:** Often fixed automatically when adopting `useLineItems` composable. Focus on remaining cases.

### Pattern to Find

```bash
# Find native elements in pages
grep -r "<select" src/pages/
grep -r "<input" src/pages/
grep -r "<button" src/pages/ | grep -v "Button"
```

### Common Replacements

**Native select → UI Select:**
```vue
<!-- Before -->
<select v-model="value" class="w-full px-2 py-1.5 rounded border...">
  <option value="">Select...</option>
  <option v-for="opt in options" :value="opt.id">{{ opt.name }}</option>
</select>

<!-- After -->
<Select v-model="value" :options="options" placeholder="Select..." />
```

**Native input → UI Input:**
```vue
<!-- Before -->
<input
  v-model="value"
  type="text"
  class="w-full px-2 py-1.5 rounded border border-slate-300..."
/>

<!-- After -->
<Input v-model="value" />
```

**Native number input → UI CurrencyInput (for money):**
```vue
<!-- Before -->
<input v-model.number="price" type="number" min="0" step="1000" class="..."/>

<!-- After -->
<CurrencyInput v-model="price" />
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Refactor `QuotationFormPage.vue` as reference implementation
- [ ] Document the pattern for team
- [ ] Add ESLint rule for hardcoded colors (warning only)

### Phase 2: Core Forms (Week 3-4)
- [ ] Refactor `InvoiceFormPage.vue`
- [ ] Refactor `BillFormPage.vue`
- [ ] Refactor `PurchaseOrderFormPage.vue`
- [ ] Migrate CSS in touched files

### Phase 3: Secondary Forms (Week 5-6)
- [ ] Refactor remaining P1 forms (Contact, Product)
- [ ] Refactor P2 forms (Project, Payment, WorkOrder, JournalEntry)

### Phase 4: Cleanup (Week 7-8)
- [ ] Refactor P3 forms
- [ ] Batch CSS migration for untouched pages
- [ ] Enable ESLint rule as error

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Forms using `useDocumentForm` | 0/15 | 15/15 |
| Forms using `useCalculation` | 0/15 | 15/15 |
| Hardcoded color occurrences | 2,876 | < 100 |
| Native HTML elements in pages | ~200 | 0 |

---

## Anti-Patterns to Avoid

### DON'T: Big Bang Refactor
Don't try to refactor all 15 forms in one PR. You'll never finish and create merge hell.

### DON'T: Copy-Paste Migration
Don't copy from other pages - they're probably wrong too. Always reference the composable source.

### DON'T: Skip Testing
Each form has subtle differences. Test create AND edit flows after each migration.

### DO: One Form, One PR
Complete one form fully (composables + CSS + native elements) before moving to next.

### DO: Document Gotchas
When you hit edge cases, add them to the composable docs or this plan.

---

## Appendix: Files to Read First

Before starting any refactor, read these files to understand the patterns:

```
src/composables/useDocumentForm/useDocumentForm.ts
src/composables/useDocumentForm/types.ts
src/composables/useLineItems/useLineItems.ts
src/services/calculation/useCalculation.ts
src/services/calculation/CalculationService.ts
```

Check for any existing form that might already be migrated as a reference (currently none found, but double-check).
