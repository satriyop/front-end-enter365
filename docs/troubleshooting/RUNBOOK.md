# Operational Runbook

> Diagnostic procedures and fixes for common production issues

---

## Quick Diagnosis Flowchart

```
Issue reported
     │
     ├─ Page not loading? ────────────▶ Check [Network Issues]
     │
     ├─ Data not showing? ────────────▶ Check [API Issues]
     │
     ├─ UI broken/unstyled? ──────────▶ Check [Build Issues]
     │
     ├─ Auth problems? ───────────────▶ Check [Authentication Issues]
     │
     ├─ Slow performance? ────────────▶ Check [Performance Issues]
     │
     └─ Console errors? ──────────────▶ Check [JavaScript Errors]
```

---

## Network Issues

### Symptoms
- Blank page with loading spinner
- "Network Error" messages
- Timeout errors

### Diagnostic Steps

```bash
# 1. Check if API is reachable
curl -I https://api.enter365.com/api/v1/health

# 2. Check browser network tab
# Open DevTools → Network → Look for failed requests (red)

# 3. Check for CORS issues
# Look for "Access-Control-Allow-Origin" errors in console
```

### Common Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| CORS error | API not allowing frontend origin | Add frontend URL to API CORS config |
| 502 Bad Gateway | API server down | Restart API server |
| Timeout | Slow API response | Check API server resources |
| ERR_CONNECTION_REFUSED | Wrong API URL | Check `VITE_API_URL` in `.env` |

---

## API Issues

### Symptoms
- Data not loading
- "undefined" displayed where data should be
- Empty lists/tables

### Diagnostic Steps

```typescript
// 1. Check TanStack Query DevTools
// Add this to see query states:
// Browser → DevTools → TanStack Query tab

// 2. Log query state in component
const { data, error, isLoading, isFetching, status } = useItems()
console.log({ data, error, isLoading, isFetching, status })

// 3. Check raw API response
const response = await api.get('/items')
console.log(response)
```

### Common Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Empty data | Query not enabled | Check `enabled` option in query |
| Stale data | Cache not invalidated | Add `queryClient.invalidateQueries()` |
| Wrong data | Query key mismatch | Check `queryKey` matches filters |
| 401 Unauthorized | Token expired | Force logout, re-login |
| 422 Validation | Bad request data | Check API error response |

### Query Debugging

```typescript
// Force refetch
const { refetch } = useItems()
await refetch()

// Clear all cache
const queryClient = useQueryClient()
queryClient.clear()

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: ['items'] })
```

---

## Authentication Issues

### Symptoms
- Redirect to login unexpectedly
- "Unauthorized" errors
- Token refresh loops

### Diagnostic Steps

```typescript
// 1. Check stored token
const token = localStorage.getItem('token')
console.log('Token exists:', !!token)

// 2. Check Pinia auth store
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
console.log({
  isAuthenticated: auth.isAuthenticated,
  user: auth.user,
  token: auth.token,
})

// 3. Decode JWT token (if applicable)
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Token expires:', new Date(payload.exp * 1000))
```

### Common Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Token expired | Session timeout | Re-login |
| Token not sent | Axios interceptor issue | Check `client.ts` interceptors |
| Refresh loop | Refresh token also expired | Clear localStorage, re-login |
| Permission denied | User lacks permission | Check user roles/permissions |

### Force Re-authentication

```typescript
// Clear all auth state
localStorage.removeItem('token')
localStorage.removeItem('user')
const auth = useAuthStore()
auth.$reset()
router.push('/login')
```

---

## Build Issues

### Symptoms
- Unstyled components
- Missing icons
- JavaScript errors on page load

### Diagnostic Steps

```bash
# 1. Check build output
npm run build 2>&1 | tee build.log

# 2. Look for TypeScript errors
npm run type-check

# 3. Check for ESLint issues
npm run lint

# 4. Verify dependencies
npm ls --depth=0
```

### Common Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Missing styles | Tailwind not processing | Check `tailwind.config.js` content paths |
| Import errors | Wrong path alias | Check `tsconfig.json` paths |
| Type errors | Missing/wrong types | Run `npm run types:generate` |
| Build fails | Dependency conflict | Delete `node_modules`, `npm install` |

### Clean Build

```bash
# Nuclear option: clean everything
rm -rf node_modules dist .vite
npm install
npm run build
```

---

## Performance Issues

### Symptoms
- Slow page loads
- Laggy interactions
- High memory usage

### Diagnostic Steps

```typescript
// 1. Check component re-renders
// Add to component:
import { watch } from 'vue'
watch(() => props, () => console.log('Props changed'), { deep: true })

// 2. Check query frequency
// TanStack Query DevTools → Observer → Fetch count

// 3. Profile with Vue DevTools
// Browser → DevTools → Vue → Performance
```

### Common Causes

| Issue | Cause | Fix |
|-------|-------|-----|
| Too many re-renders | Missing `computed()` | Use computed for derived state |
| Large lists | No virtualization | Use VirtualTable component |
| API spam | Missing staleTime | Add `staleTime: 30_000` |
| Memory leak | Uncleared intervals | Use `onUnmounted` to cleanup |

### Optimization Checklist

```typescript
// 1. Use computed for derived state
const items = computed(() => data.value?.data ?? [])

// 2. Add staleTime to queries
useQuery({
  queryKey: ['items'],
  queryFn: fetchItems,
  staleTime: 30_000, // 30 seconds
})

// 3. Use virtualization for long lists
import { VirtualTable } from '@/components/ui'
<VirtualTable :items="items" :row-height="48" />

// 4. Lazy load routes
const LazyPage = () => import('./LazyPage.vue')
```

---

## JavaScript Errors

### Common Errors and Fixes

#### "Cannot read properties of undefined"

```typescript
// WRONG
const name = data.value.user.name

// CORRECT
const name = data.value?.user?.name ?? 'Unknown'
```

#### "Maximum update depth exceeded"

```typescript
// WRONG - causes infinite loop
watch(items, () => {
  items.value = items.value.filter(...)
})

// CORRECT - use computed
const filteredItems = computed(() => items.value.filter(...))
```

#### "Component is missing template"

```vue
<!-- WRONG - missing template -->
<script setup>
// ...
</script>

<!-- CORRECT -->
<script setup>
// ...
</script>
<template>
  <div>Content</div>
</template>
```

#### "Hydration mismatch" (SSR only)

```typescript
// WRONG - server/client mismatch
const time = new Date().toLocaleString()

// CORRECT - use client-only
<ClientOnly>
  <TimeDisplay />
</ClientOnly>
```

---

## State Management Issues

### Symptoms
- UI not updating after action
- Stale data displayed
- Data inconsistency between components

### Diagnostic Steps

```typescript
// 1. Check TanStack Query cache
const queryClient = useQueryClient()
const cached = queryClient.getQueryData(['items'])
console.log('Cached data:', cached)

// 2. Check query state
const { data, dataUpdatedAt, isStale } = useItems()
console.log({
  data: data.value,
  lastUpdated: new Date(dataUpdatedAt.value),
  isStale: isStale.value,
})
```

### Common Fixes

```typescript
// Force cache invalidation after mutation
const { mutate } = useCreateItem()
mutate(newItem, {
  onSuccess: () => {
    // Invalidate list query
    queryClient.invalidateQueries({ queryKey: ['items'] })

    // Also invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['statistics'] })
  },
})

// Manual cache update (optimistic)
queryClient.setQueryData(['items'], (old) => {
  return [...old, newItem]
})
```

---

## File Download Issues

### Symptoms
- Download doesn't start
- Corrupted file downloaded
- 401 error on download

### Common Cause

```typescript
// WRONG - loses auth token
window.open('/api/reports/export')

// CORRECT - blob download with auth
async function downloadReport() {
  const response = await api.get('/reports/export', {
    responseType: 'blob',
  })

  const blob = new Blob([response.data])
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'report.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}
```

---

## Production Debugging

### Enable Debug Mode (Temporarily)

```typescript
// Add to localStorage in browser console
localStorage.setItem('debug', 'true')

// Then in code
if (localStorage.getItem('debug')) {
  console.log('Debug info:', data)
}
```

### Check Production Build Locally

```bash
# Build production
npm run build

# Preview locally
npm run preview

# Access at http://localhost:4173
```

### Check Environment Variables

```typescript
// Log all env vars (in browser console)
console.log(import.meta.env)

// Common vars to check
console.log({
  apiUrl: import.meta.env.VITE_API_URL,
  mode: import.meta.env.MODE,
  prod: import.meta.env.PROD,
})
```

---

## Emergency Procedures

### Complete Cache Clear

```typescript
// Clear everything client-side
localStorage.clear()
sessionStorage.clear()

// Clear TanStack Query
const queryClient = useQueryClient()
queryClient.clear()

// Force reload
window.location.reload()
```

### Rollback Deployment

```bash
# If using Docker/container
docker rollback <previous-version>

# If using static hosting
# Redeploy previous build artifact
```

### Contact Points

| Issue Type | Contact |
|------------|---------|
| Frontend issues | Frontend team |
| API issues | Backend team |
| Infrastructure | DevOps team |
| Security | Security team |

---

## Monitoring Checklist

Regular checks to prevent issues:

- [ ] Check browser console for errors
- [ ] Verify API response times
- [ ] Monitor TanStack Query cache hit rate
- [ ] Check bundle size after deploys
- [ ] Review error tracking dashboard

---

*Last updated: January 2025*
