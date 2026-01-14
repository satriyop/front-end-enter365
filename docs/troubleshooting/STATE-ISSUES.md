# State Issues

> Troubleshooting Vue Query, Pinia, and reactivity problems

## Quick Reference

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| Data not updating | Cache stale | Invalidate query |
| Infinite re-fetching | Unstable query key | Memoize key |
| Store not reactive | Direct mutation | Use store actions |
| Computed not updating | Reactivity lost | Check ref usage |

---

## Stale Data

### Symptoms

- Data doesn't reflect latest changes
- After mutation, list shows old data
- Need to refresh page to see updates

### Solutions

#### 1. Invalidate Query After Mutation

```typescript
const queryClient = useQueryClient()
const { mutate } = useCreateContact()

mutate(newContact, {
  onSuccess: () => {
    // Invalidate contacts list
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
  }
})
```

#### 2. Optimistic Updates

```typescript
const { mutate } = useUpdateContact()

mutate(updatedContact, {
  onMutate: async (newData) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ['contacts'] })

    // Snapshot current data
    const previous = queryClient.getQueryData(['contacts'])

    // Optimistically update
    queryClient.setQueryData(['contacts'], (old) =>
      old?.map(c => c.id === newData.id ? newData : c)
    )

    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['contacts'], context?.previous)
  },
})
```

#### 3. Force Refetch

```typescript
const { refetch } = useContacts()

// After some action
await refetch()
```

---

## Infinite Refetch

### Symptoms

- Network tab shows repeated requests
- Browser becomes slow
- Console shows many "fetching" logs

### Causes

#### 1. Unstable Query Key

```typescript
// BAD: Creates new object every render
const { data } = useQuery({
  queryKey: ['contacts', { page, status }],  // Object identity changes
})

// GOOD: Stable primitive values
const { data } = useQuery({
  queryKey: ['contacts', page, status],  // Primitives are stable
})
```

#### 2. Refetch on Every Render

```typescript
// BAD: refetchOnWindowFocus causes loops
const { data } = useQuery({
  queryKey: ['data'],
  refetchOnWindowFocus: true,
  refetchOnMount: true,
  refetchOnReconnect: true,
  staleTime: 0,  // Always stale
})

// GOOD: Set appropriate stale time
const { data } = useQuery({
  queryKey: ['data'],
  staleTime: 30 * 1000,  // Fresh for 30 seconds
})
```

#### 3. Enabled Changes

```typescript
// BAD: enabled computed changes frequently
const enabled = computed(() => !!someReactiveValue.value)

// GOOD: Debounce or stabilize
const { data } = useQuery({
  queryKey: ['data'],
  enabled: !!stableValue,
})
```

---

## Pinia Store Issues

### Store Not Updating UI

```typescript
// BAD: Destructuring loses reactivity
const { user } = authStore  // user is not reactive

// GOOD: Use storeToRefs
import { storeToRefs } from 'pinia'
const { user } = storeToRefs(authStore)  // user is reactive

// Or access directly
const userName = computed(() => authStore.user?.name)
```

### State Mutation Not Triggering Update

```typescript
// BAD: Direct mutation outside store
authStore.$state.user = newUser  // May not trigger updates

// GOOD: Use actions
authStore.setUser(newUser)  // Properly reactive

// Inside store
actions: {
  setUser(user: User) {
    this.user = user  // Triggers reactivity
  }
}
```

---

## Vue Reactivity Issues

### Computed Not Updating

```typescript
// BAD: Accessing ref without .value
const filtered = computed(() => {
  return contacts.filter(c => c.status === status)  // status is ref
})

// GOOD: Access .value
const filtered = computed(() => {
  return contacts.value.filter(c => c.status === status.value)
})
```

### Watch Not Triggering

```typescript
// BAD: Watching non-reactive source
watch(nonReactiveVariable, () => {
  // Never triggers
})

// GOOD: Watch reactive source
watch(() => someRef.value, (newVal) => {
  // Triggers on change
})

// Or with refs directly
watch(someRef, (newVal) => {
  // Triggers on change
})
```

### Array/Object Mutations Not Detected

```typescript
// BAD: Vue can't detect index assignment
arr.value[0] = newItem  // May not trigger update

// GOOD: Use array methods
arr.value.splice(0, 1, newItem)  // Triggers update

// Or reassign entire array
arr.value = [newItem, ...arr.value.slice(1)]
```

---

## Query Cache Issues

### Wrong Data Returned

```typescript
// Check query key matches
console.log(queryClient.getQueryData(['contacts', 1]))

// Clear specific cache
queryClient.removeQueries({ queryKey: ['contacts'] })

// Clear all cache
queryClient.clear()
```

### Cache Not Shared Between Components

```typescript
// Ensure same query key structure
// Component A
useQuery({ queryKey: ['contacts', { id: 1 }] })

// Component B
useQuery({ queryKey: ['contacts', { id: 1 }] })  // Same key = shared cache
```

---

## Memory Leaks

### Symptoms

- Memory usage grows over time
- Browser becomes sluggish
- DevTools shows retained objects

### Common Causes

#### 1. Uncleared Intervals

```typescript
// BAD: Interval not cleared
onMounted(() => {
  setInterval(() => {
    refetch()
  }, 5000)
})

// GOOD: Clear on unmount
const intervalId = ref<number>()

onMounted(() => {
  intervalId.value = window.setInterval(() => {
    refetch()
  }, 5000)
})

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
```

#### 2. Event Listeners Not Removed

```typescript
// BAD: Listener not removed
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// GOOD: Remove on unmount
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

#### 3. Subscriptions Not Unsubscribed

```typescript
// GOOD: Use VueUse for auto-cleanup
import { useEventListener } from '@vueuse/core'

// Automatically cleaned up
useEventListener(window, 'resize', handleResize)
```

---

## Debugging State

### Vue DevTools

1. **Components tab** - Inspect component state
2. **Pinia tab** - View store state
3. **Timeline** - Track state changes

### TanStack Query DevTools

```typescript
// Visible in development mode
// Shows:
// - All queries and their state
// - Cache contents
// - Refetch triggers
```

### Manual Debugging

```typescript
// Log query state
const { data, status, fetchStatus } = useContacts()

watch([status, fetchStatus], () => {
  console.log('Query status:', status.value, fetchStatus.value)
})

// Log store state
watch(() => authStore.user, (user) => {
  console.log('User changed:', user)
}, { deep: true })
```

---

## Best Practices

### Query Keys

```typescript
// Use consistent key factory
const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters: Filters) => [...contactKeys.lists(), filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: number) => [...contactKeys.details(), id] as const,
}

// Usage
useQuery({ queryKey: contactKeys.detail(id) })
queryClient.invalidateQueries({ queryKey: contactKeys.lists() })
```

### Stale Time Guidelines

| Data Type | Stale Time | Reason |
|-----------|------------|--------|
| Static reference data | 5+ minutes | Rarely changes |
| User data | 1-2 minutes | Changes infrequently |
| List data | 30 seconds | May change often |
| Real-time data | 0 | Always refetch |

---

## Related Documentation

- [README.md](README.md) - Troubleshooting overview
- [../api/HOOKS-PATTERN.md](../api/HOOKS-PATTERN.md) - Vue Query patterns
- [../architecture/STATE-MANAGEMENT.md](../architecture/STATE-MANAGEMENT.md) - State architecture
