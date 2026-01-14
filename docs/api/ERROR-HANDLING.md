# Error Handling

> Error handling patterns for API integration

## Error Types

| HTTP Status | Type | Handling |
|-------------|------|----------|
| 401 | Unauthorized | Token refresh or redirect to login |
| 403 | Forbidden | Show permission denied message |
| 404 | Not Found | Show not found message |
| 422 | Validation Error | Show field-level errors |
| 500 | Server Error | Show generic error message |
| Network | Connection Error | Show offline/retry message |

---

## Axios Client Interceptors

The API client (`src/api/client.ts`) handles common error scenarios:

```typescript
// Response interceptor: handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry login or refresh endpoints
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Wait for token refresh
        return new Promise(resolve => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await api.post<{ token: string }>('/auth/refresh')
        const newToken = response.data.token
        localStorage.setItem('token', newToken)
        onTokenRefreshed(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    // Handle validation errors (422)
    if (error.response?.status === 422) {
      const data = error.response.data as { errors?: Record<string, string[]>; message?: string }
      const validationError = {
        ...error,
        validationErrors: data.errors,
        message: data.message || 'Validation failed',
      }
      return Promise.reject(validationError)
    }

    return Promise.reject(error)
  }
)
```

---

## Error Message Extraction

```typescript
// src/api/client.ts
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (!error) return fallback

  // Axios error with response
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
    if (error.message) return error.message
  }

  // Error with message property
  if (error instanceof Error) {
    return error.message
  }

  // Object with message
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return fallback
}
```

---

## Usage Patterns

### Basic Error Handling

```vue
<script setup lang="ts">
import { useQuotations } from '@/api/useQuotations'
import { getErrorMessage } from '@/api/client'

const { data, isLoading, error, refetch } = useQuotations(filters)
</script>

<template>
  <LoadingSkeleton v-if="isLoading" />

  <Alert v-else-if="error" variant="destructive">
    <p>{{ getErrorMessage(error) }}</p>
    <Button variant="outline" size="sm" @click="refetch">
      Retry
    </Button>
  </Alert>

  <DataTable v-else :rows="data?.data ?? []" />
</template>
```

### Mutation Error Handling

```vue
<script setup lang="ts">
import { useCreateQuotation } from '@/api/useQuotations'
import { useToast } from '@/composables/useToast'
import { getErrorMessage } from '@/api/client'

const toast = useToast()
const { mutate, isPending, error } = useCreateQuotation()

function handleSubmit() {
  mutate(form.value, {
    onSuccess: (data) => {
      toast.success('Quotation created')
      router.push(`/quotations/${data.id}`)
    },
    onError: (err) => {
      toast.error(getErrorMessage(err))
    },
  })
}
</script>
```

### Validation Errors (422)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCreateQuotation } from '@/api/useQuotations'

const fieldErrors = ref<Record<string, string[]>>({})

const { mutate } = useCreateQuotation()

function handleSubmit() {
  fieldErrors.value = {} // Clear previous errors

  mutate(form.value, {
    onSuccess: (data) => {
      router.push(`/quotations/${data.id}`)
    },
    onError: (error) => {
      // Check for validation errors
      if ('validationErrors' in error && error.validationErrors) {
        fieldErrors.value = error.validationErrors
      } else {
        toast.error(getErrorMessage(error))
      }
    },
  })
}

// Helper to get first error for a field
function getFieldError(field: string): string | undefined {
  return fieldErrors.value[field]?.[0]
}
</script>

<template>
  <FormField label="Contact" :error="getFieldError('contact_id')">
    <Select v-model="form.contact_id" :options="contactOptions" />
  </FormField>

  <FormField label="Valid Until" :error="getFieldError('valid_until')">
    <Input v-model="form.valid_until" type="date" />
  </FormField>
</template>
```

---

## Error UI Components

### Alert Component

```vue
<Alert variant="destructive">
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to load quotations. Please try again.
  </AlertDescription>
</Alert>
```

### Toast Notification

```typescript
import { useToast } from '@/composables/useToast'

const toast = useToast()

toast.success('Quotation created')
toast.error('Failed to save')
toast.warning('Session expiring soon')
toast.info('Processing...')
```

### Inline Field Errors

```vue
<FormField
  label="Email"
  :error="errors.email"
>
  <Input v-model="form.email" type="email" />
</FormField>
```

---

## Error Boundaries

### Page-Level Error

```vue
<script setup lang="ts">
const { data, isLoading, error, refetch } = useQuotation(id)
</script>

<template>
  <PageSkeleton v-if="isLoading" />

  <div v-else-if="error" class="flex flex-col items-center justify-center py-12">
    <AlertCircle class="w-12 h-12 text-destructive mb-4" />
    <h2 class="text-lg font-semibold mb-2">Failed to load</h2>
    <p class="text-muted-foreground mb-4">{{ getErrorMessage(error) }}</p>
    <Button @click="refetch">Try Again</Button>
  </div>

  <QuotationDetail v-else :quotation="data" />
</template>
```

### Component-Level Error

```vue
<script setup lang="ts">
const { data, error, isLoading } = useRecentActivity()
</script>

<template>
  <Card>
    <CardHeader>Recent Activity</CardHeader>
    <CardContent>
      <LoadingSkeleton v-if="isLoading" />
      <Alert v-else-if="error" variant="destructive">
        Failed to load activity
      </Alert>
      <ActivityList v-else :items="data" />
    </CardContent>
  </Card>
</template>
```

---

## Network Error Handling

```vue
<script setup lang="ts">
import { useOnlineStatus } from '@/composables/useOnlineStatus'

const isOnline = useOnlineStatus()
</script>

<template>
  <Alert v-if="!isOnline" variant="warning">
    You appear to be offline. Some features may not work.
  </Alert>
</template>
```

---

## Related Documentation

- [HOOKS-PATTERN.md](HOOKS-PATTERN.md) - Query patterns
- [MUTATIONS.md](MUTATIONS.md) - Mutation patterns
- [AUTHENTICATION.md](AUTHENTICATION.md) - Auth error handling
