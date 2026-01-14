# ADR 0005: Pinia for Authentication Only

## Status

**Accepted**

## Date

2024-10-15

## Context

We need to decide how to use Pinia in the application. Common approaches:

1. **Pinia for everything** - All state in Pinia stores
2. **Pinia for client state only** - Server state in TanStack Query
3. **No Pinia** - Only TanStack Query and component state

## Decision

We use **Pinia only for authentication state**. All other server-side data uses TanStack Query.

## Rationale

### What Goes Where

| State Type | Location | Example |
|------------|----------|---------|
| Auth (user, token, permissions) | Pinia | `useAuthStore()` |
| Server data (CRUD entities) | TanStack Query | `useQuotations()` |
| Form state | Component `ref()` | Form fields |
| UI state | Component `ref()` | Modal open, sidebar |
| Derived state | `computed()` | Filtered lists |

### Why Auth in Pinia

Authentication is different from other data:
- Needed globally (nav, guards, permissions)
- Doesn't need cache invalidation
- Changes rarely during session
- Needs to persist across page loads

```typescript
// src/stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  const hasPermission = (permission: string) => {
    if (!user.value) return false
    if (user.value.roles?.some(r => r.name === 'admin')) return true
    return user.value.permissions?.some(p => p.name === permission) ?? false
  }

  // ... login, logout, fetchUser

  return { user, token, isAuthenticated, hasPermission, ... }
})
```

### Why Not Pinia for Server Data

Server data has different requirements:

| Requirement | Pinia | TanStack Query |
|-------------|-------|----------------|
| Caching | Manual | Automatic |
| Background refetch | Manual | Automatic |
| Cache invalidation | Manual | Built-in |
| Loading states | Manual | Built-in |
| Error states | Manual | Built-in |
| Deduplication | Manual | Automatic |

**Pinia approach requires ~100 lines per entity:**
```typescript
// DON'T: Pinia for server data
const quotationsStore = defineStore('quotations', () => {
  const quotations = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const cache = new Map()

  async function fetchQuotations(filters) {
    // Check cache
    // Set loading
    // Try/catch
    // Handle errors
    // Update cache
    // Return data
  }

  function invalidateCache() { }
  function getFromCache() { }
  // ... many more methods

  return { quotations, isLoading, error, fetchQuotations, ... }
})
```

**TanStack Query approach: ~10 lines:**
```typescript
// DO: TanStack Query for server data
export function useQuotations(filters: Ref<Filters>) {
  return useQuery({
    queryKey: computed(() => ['quotations', filters.value]),
    queryFn: () => api.get('/quotations', { params: filters.value }),
  })
}
```

### Store Count

| Store | Purpose |
|-------|---------|
| `auth.ts` | User, token, permissions |
| **Total: 1** | |

Everything else uses:
- TanStack Query hooks (server data)
- Component `ref()` (local state)
- `computed()` (derived state)

## Consequences

### Positive

- Single responsibility: Pinia = auth only
- Less boilerplate (no store per entity)
- TanStack Query handles complexity
- Clear mental model
- Easy to find auth-related code

### Negative

- Team needs to understand the distinction
- Can't use Pinia DevTools for server data
- Different patterns for auth vs other data

### Mitigations

- Document patterns in [STATE-MANAGEMENT.md](../STATE-MANAGEMENT.md)
- TanStack Query has its own DevTools
- Consistent hook naming (`useX` for all data fetching)

## Anti-Patterns to Avoid

```typescript
// DON'T: Server data in Pinia
const productsStore = defineStore('products', () => {
  const products = ref([])
  // ...
})

// DON'T: Multiple auth stores
const userStore = defineStore('user', ...)
const tokenStore = defineStore('token', ...)
const permissionsStore = defineStore('permissions', ...)

// DO: Single auth store
const authStore = defineStore('auth', () => {
  const user = ref()
  const token = ref()
  const hasPermission = (p) => ...
})

// DO: TanStack Query for server data
const { data: products } = useProducts(filters)
```

## References

- [Pinia Documentation](https://pinia.vuejs.org/)
- [ADR 0002: TanStack Query](0002-tanstack-query-server-state.md)
- [State Management](../STATE-MANAGEMENT.md)
