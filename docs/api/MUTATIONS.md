# Mutations

> Create, Update, Delete patterns with TanStack Query

## Overview

Mutations modify server data and typically require:
1. Sending data to API
2. Handling success/error
3. Invalidating related queries
4. Providing UI feedback

---

## Basic Mutation Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'

export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    // The actual API call
    mutationFn: async (data: CreateQuotationData) => {
      const response = await api.post('/quotations', data)
      return response.data.data
    },

    // Invalidate list after success
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
```

---

## CRUD Mutations

### Create

```typescript
export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQuotationData) => {
      const response = await api.post<{ data: Quotation }>('/quotations', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

// Usage
const { mutate, isPending, error } = useCreateQuotation()

function handleSubmit() {
  mutate(formData, {
    onSuccess: (data) => {
      toast.success('Created')
      router.push(`/quotations/${data.id}`)
    },
    onError: (error) => {
      toast.error(getErrorMessage(error))
    },
  })
}
```

### Update

```typescript
export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateQuotationData }) => {
      const response = await api.put<{ data: Quotation }>(
        `/quotations/${id}`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      // Invalidate list AND detail
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
    },
  })
}

// Usage
const { mutate: updateQuotation, isPending } = useUpdateQuotation()

function handleSave() {
  updateQuotation(
    { id: quotationId, data: form.value },
    {
      onSuccess: () => toast.success('Saved'),
    }
  )
}
```

### Delete

```typescript
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

// Usage with confirmation
const { mutate: deleteQuotation, isPending: isDeleting } = useDeleteQuotation()

function handleDelete(id: number) {
  if (!confirm('Delete this quotation?')) return

  deleteQuotation(id, {
    onSuccess: () => {
      toast.success('Deleted')
      router.push('/quotations')
    },
  })
}
```

---

## Action Mutations

### Status Change Actions

```typescript
// Submit for approval
export function useSubmitQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(
        `/quotations/${id}/submit`
      )
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
    },
  })
}

// Approve
export function useApproveQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(
        `/quotations/${id}/approve`
      )
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
    },
  })
}

// Reject
export function useRejectQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await api.post<{ data: Quotation }>(
        `/quotations/${id}/reject`,
        { reason }
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
    },
  })
}
```

### Convert Actions

```typescript
// Convert quotation to invoice
export function useConvertToInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (quotationId: number) => {
      const response = await api.post<{ data: Invoice }>(
        `/quotations/${quotationId}/convert-to-invoice`
      )
      return response.data.data
    },
    onSuccess: (_, quotationId) => {
      // Invalidate both quotations and invoices
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

// Usage
const { mutate: convertToInvoice, isPending } = useConvertToInvoice()

function handleConvert() {
  convertToInvoice(quotationId, {
    onSuccess: (invoice) => {
      toast.success('Invoice created')
      router.push(`/invoices/${invoice.id}`)
    },
  })
}
```

---

## Usage in Components

### Form Submit

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateQuotation } from '@/api/useQuotations'
import { useToast } from '@/composables/useToast'
import { getErrorMessage } from '@/api/client'

const router = useRouter()
const toast = useToast()

const form = ref({
  contact_id: null,
  valid_until: '',
  notes: '',
  items: [],
})

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

<template>
  <form @submit.prevent="handleSubmit">
    <!-- Form fields -->

    <Button type="submit" :disabled="isPending">
      {{ isPending ? 'Saving...' : 'Save' }}
    </Button>
  </form>
</template>
```

### Action Buttons

```vue
<script setup lang="ts">
import { useSubmitQuotation, useApproveQuotation } from '@/api/useQuotations'

const props = defineProps<{ quotation: Quotation }>()

const { mutate: submit, isPending: isSubmitting } = useSubmitQuotation()
const { mutate: approve, isPending: isApproving } = useApproveQuotation()

function handleSubmit() {
  submit(props.quotation.id, {
    onSuccess: () => toast.success('Submitted for approval'),
  })
}

function handleApprove() {
  approve(props.quotation.id, {
    onSuccess: () => toast.success('Approved'),
  })
}
</script>

<template>
  <div class="flex gap-2">
    <Button
      v-if="quotation.status === 'draft'"
      @click="handleSubmit"
      :disabled="isSubmitting"
    >
      Submit
    </Button>

    <Button
      v-if="quotation.status === 'submitted'"
      variant="success"
      @click="handleApprove"
      :disabled="isApproving"
    >
      Approve
    </Button>
  </div>
</template>
```

### Delete with Confirmation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useDeleteQuotation } from '@/api/useQuotations'

const props = defineProps<{ id: number }>()
const emit = defineEmits<{ (e: 'deleted'): void }>()

const showConfirm = ref(false)
const { mutate: deleteQuotation, isPending } = useDeleteQuotation()

function handleDelete() {
  deleteQuotation(props.id, {
    onSuccess: () => {
      showConfirm.value = false
      toast.success('Deleted')
      emit('deleted')
    },
  })
}
</script>

<template>
  <Button variant="destructive" @click="showConfirm = true">
    Delete
  </Button>

  <Modal :open="showConfirm" @close="showConfirm = false" title="Confirm Delete">
    <p>Are you sure you want to delete this quotation?</p>

    <div class="flex justify-end gap-2 mt-4">
      <Button variant="outline" @click="showConfirm = false">
        Cancel
      </Button>
      <Button variant="destructive" @click="handleDelete" :disabled="isPending">
        {{ isPending ? 'Deleting...' : 'Delete' }}
      </Button>
    </div>
  </Modal>
</template>
```

---

## Invalidation Patterns

### Single Entity

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['quotations'] })
}
```

### Entity + Detail

```typescript
onSuccess: (_, { id }) => {
  queryClient.invalidateQueries({ queryKey: ['quotations'] })
  queryClient.invalidateQueries({ queryKey: ['quotation', id] })
}
```

### Related Entities

```typescript
// After creating invoice from quotation
onSuccess: (_, quotationId) => {
  queryClient.invalidateQueries({ queryKey: ['quotations'] })
  queryClient.invalidateQueries({ queryKey: ['quotation', quotationId] })
  queryClient.invalidateQueries({ queryKey: ['invoices'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}
```

---

## Error Handling

```typescript
mutate(data, {
  onSuccess: (result) => {
    toast.success('Saved')
    router.push(`/quotations/${result.id}`)
  },
  onError: (error) => {
    // Check for validation errors (422)
    if ('validationErrors' in error) {
      // Show field-level errors
      setFieldErrors(error.validationErrors)
    } else {
      // Show generic error
      toast.error(getErrorMessage(error))
    }
  },
})
```

See [ERROR-HANDLING.md](ERROR-HANDLING.md) for detailed error handling patterns.

---

## Related Documentation

- [HOOKS-PATTERN.md](HOOKS-PATTERN.md) - Query patterns
- [ERROR-HANDLING.md](ERROR-HANDLING.md) - Error handling
- [STATE-MANAGEMENT.md](../architecture/STATE-MANAGEMENT.md)
