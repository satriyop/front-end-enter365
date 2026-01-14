# State Management

> Patterns for Pinia and TanStack Query in Enter365

## Overview

| State Type | Technology | Examples |
|------------|------------|----------|
| Server State | TanStack Query | Quotations, products, users |
| Auth State | Pinia | Current user, token, permissions |
| Form State | Component `ref()` | Form fields, validation errors |
| UI State | Component `ref()` | Modal open, sidebar collapsed |

---

## TanStack Query (Server State)

### Query Pattern

```typescript
// src/api/useQuotations.ts
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import { computed } from 'vue'

// Filter interface
export interface QuotationFilters {
  page: number
  per_page: number
  search?: string
  status?: string
}

// List query
export function useQuotations(filters: Ref<QuotationFilters>) {
  return useQuery({
    // Query key includes filters for cache separation
    queryKey: computed(() => ['quotations', filters.value]),

    // Query function
    queryFn: async () => {
      // Filter out empty values
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined)
      )
      const response = await api.get('/quotations', { params: cleanParams })
      return response.data
    },

    // Cache for 30 seconds
    staleTime: 30_000,
  })
}
```

### Single Item Query

```typescript
export function useQuotation(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['quotation', id.value]),
    queryFn: async () => {
      const response = await api.get(`/quotations/${id.value}`)
      return response.data.data
    },
    // Only fetch when ID is valid
    enabled: computed(() => !!id.value && id.value > 0),
  })
}
```

### Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query'

export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQuotationData) => {
      const response = await api.post('/quotations', data)
      return response.data.data
    },

    onSuccess: () => {
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateQuotationData }) => {
      const response = await api.put(`/quotations/${id}`, data)
      return response.data.data
    },

    onSuccess: (_, { id }) => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
    },
  })
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quotations/${id}`)
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
```

### Usage in Components

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuotations, useDeleteQuotation } from '@/api/useQuotations'
import { useToast } from '@/composables/useToast'

// Filters (reactive)
const filters = ref({
  page: 1,
  per_page: 10,
  search: '',
  status: '',
})

// Query
const { data, isLoading, error, refetch } = useQuotations(filters)

// Derived state
const quotations = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

// Mutation
const toast = useToast()
const { mutate: deleteQuotation, isPending: isDeleting } = useDeleteQuotation()

function handleDelete(id: number) {
  deleteQuotation(id, {
    onSuccess: () => toast.success('Quotation deleted'),
    onError: (error) => toast.error(getErrorMessage(error)),
  })
}
</script>
```

---

## Pinia (Auth State)

### Auth Store

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import router from '@/router'

export interface User {
  id: number
  name: string
  email: string
  roles?: Role[]
  permissions?: Permission[]
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  // Getters
  const isAuthenticated = computed(() => !!token.value)

  const hasPermission = (permission: string) => {
    if (!user.value) return false
    // Admin has all permissions
    if (user.value.roles?.some(r => r.name === 'admin')) return true
    return user.value.permissions?.some(p => p.name === permission) ?? false
  }

  const hasRole = (role: string) => {
    return user.value?.roles?.some(r => r.name === role) ?? false
  }

  // Actions
  async function login(credentials: { email: string; password: string }) {
    const response = await api.post('/auth/login', credentials)
    token.value = response.data.token
    user.value = response.data.user
    localStorage.setItem('token', response.data.token)

    const redirect = router.currentRoute.value.query.redirect as string
    router.push(redirect || '/')
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      router.push('/login')
    }
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const response = await api.get('/auth/me')
      user.value = response.data.user
    } catch {
      await logout()
    }
  }

  // Initialize
  if (token.value) {
    fetchUser()
  }

  return {
    user,
    token,
    isAuthenticated,
    hasPermission,
    hasRole,
    login,
    logout,
    fetchUser,
  }
})
```

### Usage

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Check authentication
if (!auth.isAuthenticated) {
  // redirect
}

// Check permission
if (auth.hasPermission('quotations.create')) {
  // show create button
}

// Check role
if (auth.hasRole('admin')) {
  // show admin panel
}

// Logout
function handleLogout() {
  auth.logout()
}
</script>
```

---

## Form State

### Simple Form

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCreateQuotation } from '@/api/useQuotations'

const form = ref({
  contact_id: null,
  valid_until: '',
  notes: '',
  items: [],
})

const { mutate, isPending } = useCreateQuotation()

function handleSubmit() {
  mutate(form.value, {
    onSuccess: (data) => {
      router.push(`/quotations/${data.id}`)
    },
  })
}
</script>
```

### With VeeValidate + Zod

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

const schema = toTypedSchema(
  z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Min 8 characters'),
  })
)

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: schema,
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit((values) => {
  // values is typed
  auth.login(values)
})
</script>
```

---

## Key Patterns

### 1. Always Use Computed Query Keys

```typescript
// DO: Reactive to filter changes
queryKey: computed(() => ['quotations', filters.value])

// DON'T: Won't update when filters change
queryKey: ['quotations', filters.value]
```

### 2. Filter Empty Parameters

```typescript
// Always filter before sending to API
const cleanParams = Object.fromEntries(
  Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
)
```

### 3. Invalidate Related Queries

```typescript
onSuccess: () => {
  // Invalidate list
  queryClient.invalidateQueries({ queryKey: ['quotations'] })

  // Also invalidate related entities
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}
```

### 4. Use Enabled for Conditional Queries

```typescript
export function useQuotation(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['quotation', id.value]),
    queryFn: () => api.get(`/quotations/${id.value}`),
    // Only fetch when ID is valid
    enabled: computed(() => !!id.value && id.value > 0),
  })
}
```

### 5. Derive State with Computed

```vue
<script setup lang="ts">
const { data } = useQuotations(filters)

// Derive, don't duplicate
const quotations = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)
const totalAmount = computed(() =>
  quotations.value.reduce((sum, q) => sum + q.grand_total, 0)
)
</script>
```

---

## Common Mistakes

### Mistake 1: Using Pinia for Server Data

```typescript
// DON'T: Server data in Pinia
const quotationsStore = defineStore('quotations', () => {
  const quotations = ref([])
  async function fetchQuotations() {
    quotations.value = await api.get('/quotations')
  }
  return { quotations, fetchQuotations }
})

// DO: Use TanStack Query
const { data: quotations } = useQuotations(filters)
```

### Mistake 2: Not Invalidating After Mutations

```typescript
// DON'T: List won't refresh
const { mutate } = useMutation({
  mutationFn: (data) => api.post('/quotations', data),
  // Missing onSuccess invalidation!
})

// DO: Invalidate list
const { mutate } = useMutation({
  mutationFn: (data) => api.post('/quotations', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['quotations'] })
  },
})
```

### Mistake 3: Direct Ref Assignment

```typescript
// DON'T: Breaks reactivity
const quotations = ref([])
watch(data, (newData) => {
  quotations.value = newData?.data // Unnecessary copy
})

// DO: Use computed
const quotations = computed(() => data.value?.data ?? [])
```

---

## Related Documentation

- [API Hooks Pattern](../api/HOOKS-PATTERN.md)
- [Tech Stack](TECH-STACK.md)
- [ADR 0002](adr/0002-tanstack-query-server-state.md)
