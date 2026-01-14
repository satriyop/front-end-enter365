# ADR 0002: TanStack Query for Server State

## Status

**Accepted**

## Date

2024-10-01

## Context

The Enter365 application needs to:
- Fetch data from 20+ API endpoints
- Handle complex cache invalidation (e.g., creating invoice invalidates quotation)
- Support pagination, filtering, and sorting
- Show loading and error states
- Minimize unnecessary API calls

### Options Considered

1. **TanStack Query (Vue Query)**
2. **Pinia for everything**
3. **Plain Axios with manual state**
4. **SWR (via useSWR-like composable)**

## Decision

We chose **TanStack Query** for all server state management.

## Rationale

### Comparison

| Feature | TanStack Query | Pinia | Plain Axios |
|---------|---------------|-------|-------------|
| Automatic caching | Yes | Manual | No |
| Background refetch | Yes | Manual | No |
| Query invalidation | Built-in | Manual | Manual |
| Request deduplication | Yes | No | No |
| Loading/error states | Yes | Manual | Manual |
| DevTools | Yes | Yes | No |
| Pagination support | Built-in | Manual | Manual |

### Key Benefits

1. **Cache Management**
   ```typescript
   // Automatic cache per query key
   const { data } = useQuotations(filters)
   // Cached! No refetch if data is fresh
   ```

2. **Smart Invalidation**
   ```typescript
   // After mutation, invalidate related queries
   onSuccess: () => {
     queryClient.invalidateQueries({ queryKey: ['quotations'] })
     queryClient.invalidateQueries({ queryKey: ['dashboard'] })
   }
   ```

3. **Background Refetching**
   - Data shows immediately from cache
   - Fresh data fetched in background
   - UI updates when new data arrives

4. **Request Deduplication**
   - Multiple components using same query = 1 request
   - No race conditions

### Why Not Pinia for Server Data

Pinia is great for **client-side state** (auth, UI preferences), but server data has different requirements:

```typescript
// PROBLEM: Pinia requires manual everything
const quotationsStore = defineStore('quotations', () => {
  const quotations = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchQuotations(filters) {
    isLoading.value = true
    try {
      quotations.value = await api.get('/quotations', { params: filters })
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  // Manual cache invalidation
  // Manual refetch logic
  // Manual deduplication
  // ...100s of lines of boilerplate

  return { quotations, isLoading, error, fetchQuotations }
})

// SOLUTION: TanStack Query handles all this
const { data, isLoading, error, refetch } = useQuotations(filters)
```

## Consequences

### Positive

- Reduced boilerplate (no manual loading/error states)
- Automatic caching reduces API calls
- Smart cache invalidation for complex workflows
- DevTools for debugging queries
- Consistent patterns across all API hooks

### Negative

- Additional library to learn
- Query key management requires discipline
- Potential for over-fetching if staleTime not configured

### Mitigations

- Document query patterns in [HOOKS-PATTERN.md](../../api/HOOKS-PATTERN.md)
- Set reasonable `staleTime` defaults (30 seconds)
- Use consistent query key naming

## Implementation

See [STATE-MANAGEMENT.md](../STATE-MANAGEMENT.md) for detailed patterns.

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
