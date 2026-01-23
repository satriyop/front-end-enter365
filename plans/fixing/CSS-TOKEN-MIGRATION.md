# CSS Design Token Migration Reference

> Quick reference for migrating hardcoded Tailwind colors to semantic tokens

## Why Migrate?

Hardcoded colors like `text-slate-500 dark:text-slate-400` require:
- Manual dark mode handling
- Inconsistent shades across pages
- Theme changes touch every file

Semantic tokens like `text-muted-foreground` provide:
- Automatic dark mode
- Single source of truth
- Easy theme customization

---

## Token Mapping

### Text Colors

| Hardcoded Pattern | Semantic Token |
|-------------------|----------------|
| `text-slate-900 dark:text-slate-100` | `text-foreground` |
| `text-slate-800 dark:text-slate-200` | `text-foreground` |
| `text-slate-500 dark:text-slate-400` | `text-muted-foreground` |
| `text-slate-600 dark:text-slate-400` | `text-muted-foreground` |
| `text-slate-400 dark:text-slate-500` | `text-muted-foreground` |
| `text-red-500` | `text-destructive` |
| `text-red-600` | `text-destructive` |
| `text-orange-600 dark:text-orange-400` | `text-primary` |
| `text-orange-500` | `text-primary` |
| `text-green-600 dark:text-green-400` | `text-success` (if defined) |

### Background Colors

| Hardcoded Pattern | Semantic Token |
|-------------------|----------------|
| `bg-white dark:bg-slate-900` | `bg-background` |
| `bg-white dark:bg-slate-800` | `bg-card` |
| `bg-slate-50 dark:bg-slate-800` | `bg-muted` |
| `bg-slate-100 dark:bg-slate-800` | `bg-muted` |
| `bg-slate-900 dark:bg-slate-50` | `bg-foreground` (rare) |
| `bg-orange-500` | `bg-primary` |
| `bg-orange-600` | `bg-primary` |
| `bg-red-500` | `bg-destructive` |

### Border Colors

| Hardcoded Pattern | Semantic Token |
|-------------------|----------------|
| `border-slate-200 dark:border-slate-700` | `border-border` |
| `border-slate-300 dark:border-slate-600` | `border-border` |
| `border-slate-100 dark:border-slate-800` | `border-border` |

### Ring/Focus Colors

| Hardcoded Pattern | Semantic Token |
|-------------------|----------------|
| `ring-orange-500` | `ring-ring` |
| `focus:ring-orange-500` | `focus:ring-ring` |
| `focus-visible:ring-orange-500` | `focus-visible:ring-ring` |

---

## Regex Patterns for Find/Replace

### VS Code Find (Regex mode enabled)

**Text muted:**
```regex
Find: text-slate-[456]00 dark:text-slate-[345]00
Replace: text-muted-foreground
```

**Text foreground:**
```regex
Find: text-slate-[89]00 dark:text-slate-[12]00
Replace: text-foreground
```

**Background card:**
```regex
Find: bg-white dark:bg-slate-[89]00
Replace: bg-card
```

**Border:**
```regex
Find: border-slate-[123]00 dark:border-slate-[678]00
Replace: border-border
```

---

## Common Component Patterns

### Page Header
```vue
<!-- Before -->
<h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Title</h1>
<p class="text-slate-500 dark:text-slate-400">Description</p>

<!-- After -->
<h1 class="text-2xl font-semibold text-foreground">Title</h1>
<p class="text-muted-foreground">Description</p>
```

### Card Container
```vue
<!-- Before -->
<div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">

<!-- After -->
<div class="bg-card rounded-xl border border-border">
<!-- Or better: use Card component -->
<Card>
```

### Table Header
```vue
<!-- Before -->
<thead class="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">

<!-- After -->
<thead class="bg-muted text-muted-foreground">
```

### Empty/Loading States
```vue
<!-- Before -->
<div class="text-slate-500 dark:text-slate-400">Loading...</div>

<!-- After -->
<div class="text-muted-foreground">Loading...</div>
```

### Error States
```vue
<!-- Before -->
<p class="text-red-500">Error message</p>

<!-- After -->
<p class="text-destructive">Error message</p>
```

---

## Files to Prioritize

High-traffic pages that benefit most from migration:

1. **List pages** (appear most frequently)
   - `QuotationListPage.vue`
   - `InvoiceListPage.vue`
   - `ContactListPage.vue`

2. **Form pages** (complex, many elements)
   - `QuotationFormPage.vue`
   - `InvoiceFormPage.vue`

3. **Detail pages** (user reads closely)
   - `QuotationDetailPage.vue`
   - `InvoiceDetailPage.vue`

4. **Shared components** (affect everything)
   - `Card.vue`
   - `Modal.vue`
   - `FilterBar.vue`
   - `DataTable.vue`

---

## Verification

After migrating a file:

1. **Visual check in light mode** - looks correct?
2. **Visual check in dark mode** - no white/bright elements?
3. **Compare with unmigrated page** - similar appearance?

Common issues:
- Missing dark mode class removal (now handled by token)
- Inconsistent shades (token normalizes them)
- Hover states may need separate handling

---

## DO NOT Migrate

Some hardcoded colors are intentional:

- Status badge colors (green for approved, red for rejected)
- Chart colors
- Brand colors in specific contexts
- Hover state variations (`hover:text-orange-700`)

When in doubt, check if there's a semantic meaning or if it's just "gray text".
