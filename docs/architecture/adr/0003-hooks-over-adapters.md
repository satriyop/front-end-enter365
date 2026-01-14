# ADR 0003: Hooks Pattern Over Adapter Layer

## Status

**Accepted**

## Date

2024-10-15

## Context

When building the API integration layer, we needed to decide on the level of abstraction:

```
┌─────────────────────────────────────────────────────────────────┐
│  SIMPLE ◄────────────────────────────────────────► COMPLEX      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Level 1          Level 2          Level 3         Level 4      │
│  Direct Fetch     Hooks Layer      Adapter Layer   Full DDD     │
│                                                                  │
│  fetch() in       useQuotations()  Transform +     Domain        │
│  component        hook             Adapter         Entities      │
│                                                                  │
│  ────────────────────────────────────────────────────────────── │
│  Solo dev         Small team       Separate        Enterprise    │
│  Prototype        Production       teams           Scale         │
│  Move fast        Maintainable     Decoupled       Complex       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Options Considered

1. **Level 2: Hooks Pattern** - TanStack Query hooks returning API types directly
2. **Level 3: Adapter Pattern** - Transform API responses to frontend "View" types

## Decision

We chose **Level 2: Hooks Pattern** for Enter365.

## Rationale

### Our Context

| Factor | Our Situation |
|--------|---------------|
| Team size | Small (1-3 developers) |
| Frontend/Backend | Same developers |
| API design | Well-designed (Laravel Resources) |
| Priority | Ship features fast |

### When Adapter Pattern Makes Sense

The adapter pattern is valuable when:
- API changes frequently break multiple components
- Frontend and backend are separate teams
- Complex transformations needed everywhere
- API returns data in awkward shapes

**None of these apply to us.**

### Comparison

| Aspect | Hooks (Level 2) | Adapter (Level 3) |
|--------|-----------------|-------------------|
| Setup complexity | Low | High |
| Type duplication | None | Required |
| API change impact | Multiple components | One adapter |
| Development speed | Fast | Slower |
| Boilerplate | Minimal | Significant |

### Code Comparison

**Level 2: Hooks (our choice)**
```typescript
// src/api/useQuotations.ts
export function useQuotations(filters: Ref<QuotationFilters>) {
  return useQuery({
    queryKey: computed(() => ['quotations', filters.value]),
    queryFn: () => api.get('/quotations', { params: filters.value }),
  })
}

// Usage in component
const { data, isLoading } = useQuotations(filters)
const quotations = computed(() => data.value?.data ?? [])
```

**Level 3: Adapter (not chosen)**
```typescript
// api/types.ts - API response types
interface ApiQuotation { ... }

// domain/types.ts - Frontend types (duplicated!)
interface QuotationView { ... }

// adapters/quotationAdapter.ts
function toQuotationView(api: ApiQuotation): QuotationView {
  return {
    id: api.id,
    number: api.quotation_number,
    customerName: api.contact.company_name,
    // ...transform all fields
  }
}

// services/quotationService.ts
async function getQuotations(): Promise<QuotationView[]> {
  const response = await api.get('/quotations')
  return response.data.map(toQuotationView)
}

// hooks/useQuotations.ts
export function useQuotations() {
  return useQuery({
    queryKey: ['quotations'],
    queryFn: quotationService.getQuotations,
  })
}

// Much more code for the same result!
```

## Consequences

### Positive

- Faster development
- Less boilerplate
- Types match API exactly (OpenAPI generated)
- Easier to trace data flow
- Simpler mental model

### Negative

- API changes may require updating multiple components
- No central place to normalize API quirks
- Less separation of concerns

### Mitigations

1. **TypeScript catches API changes at compile time**
   ```bash
   npm run types:generate  # Regenerate types
   # TypeScript immediately shows where code needs updates
   ```

2. **Extract common transformations**
   ```typescript
   // utils/format.ts
   export function formatCurrency(amount: number): string { ... }
   export function formatDate(date: string): string { ... }

   // Use in components
   {{ formatCurrency(quotation.grand_total) }}
   ```

3. **Re-evaluate if pain points emerge**
   - If we find ourselves transforming same data in 5+ places → add adapter for that entity
   - Can add adapters incrementally, not all at once

## When to Add Complexity

```
┌─────────────────────────────────────────────────────────────────┐
│  ADD ADAPTER LAYER ONLY WHEN YOU FEEL THE PAIN                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Signs you need more abstraction:                                │
│                                                                  │
│  □ Same transformation in 5+ places                              │
│    → Extract to a function                                       │
│                                                                  │
│  □ API changes break multiple components frequently              │
│    → Add adapter for THAT entity                                 │
│                                                                  │
│  □ Backend returns data in shape you keep fighting               │
│    → Transform at API boundary                                   │
│                                                                  │
│  □ Need to combine data from multiple endpoints                  │
│    → Composite hook or adapter                                   │
│                                                                  │
│  Key principle: Add complexity when you FEEL the pain,           │
│  not in anticipation of pain that may never come.                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## References

- [Hooks Pattern Documentation](../../api/HOOKS-PATTERN.md)
- Original discussion: `ideas/adapter_pattern.md`
