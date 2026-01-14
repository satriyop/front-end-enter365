# Form Patterns

> Form handling, validation, and field components

## Form Field Component

### Import

```typescript
import { FormField, Input, Select, Textarea } from '@/components/ui'
```

### Usage

```vue
<template>
  <FormField label="Company Name" :error="errors.company_name">
    <Input v-model="form.company_name" />
  </FormField>

  <FormField label="Contact" :error="errors.contact_id" required>
    <Select v-model="form.contact_id" :options="contactOptions" />
  </FormField>

  <FormField label="Notes" :error="errors.notes">
    <Textarea v-model="form.notes" rows="4" />
  </FormField>
</template>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Field label |
| `error` | string | - | Error message |
| `required` | boolean | `false` | Show required indicator |

---

## Currency Input

### Import

```typescript
import { CurrencyInput } from '@/components/ui'
```

### Usage

```vue
<script setup lang="ts">
import { CurrencyInput } from '@/components/ui'
import { ref } from 'vue'

const price = ref(1500000) // Stores as number
</script>

<template>
  <!-- Displays as "Rp 1.500.000" -->
  <FormField label="Price">
    <CurrencyInput v-model="price" />
  </FormField>
</template>
```

---

## Number Input

### Import

```typescript
import { NumberInput } from '@/components/ui'
```

### Usage

```vue
<template>
  <FormField label="Quantity">
    <NumberInput v-model="form.quantity" :min="1" :max="100" />
  </FormField>

  <FormField label="Discount (%)">
    <NumberInput v-model="form.discount" :min="0" :max="100" :step="0.5" />
  </FormField>
</template>
```

---

## Basic Form Pattern

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateQuotation } from '@/api/useQuotations'
import { useToast } from '@/composables/useToast'
import { getErrorMessage } from '@/api/client'
import { Button, Card, FormField, Input, Select, Textarea } from '@/components/ui'

const router = useRouter()
const toast = useToast()

// Form state
const form = ref({
  contact_id: null as number | null,
  valid_until: '',
  notes: '',
})

// Validation errors
const errors = ref<Record<string, string>>({})

// Mutation
const { mutate, isPending } = useCreateQuotation()

// Submit handler
function handleSubmit() {
  errors.value = {} // Clear errors

  mutate(form.value, {
    onSuccess: (data) => {
      toast.success('Quotation created')
      router.push(`/quotations/${data.id}`)
    },
    onError: (error) => {
      if ('validationErrors' in error && error.validationErrors) {
        // Map API errors to form errors
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          errors.value[field] = messages[0]
        })
      } else {
        toast.error(getErrorMessage(error))
      }
    },
  })
}
</script>

<template>
  <Card>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <FormField label="Contact" :error="errors.contact_id" required>
        <Select
          v-model="form.contact_id"
          :options="contactOptions"
          placeholder="Select contact..."
        />
      </FormField>

      <FormField label="Valid Until" :error="errors.valid_until" required>
        <Input v-model="form.valid_until" type="date" />
      </FormField>

      <FormField label="Notes" :error="errors.notes">
        <Textarea v-model="form.notes" rows="3" />
      </FormField>

      <div class="flex justify-end gap-2 pt-4">
        <Button variant="outline" type="button" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :disabled="isPending">
          {{ isPending ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </form>
  </Card>
</template>
```

---

## Edit Form Pattern

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuotation, useUpdateQuotation } from '@/api/useQuotations'

const route = useRoute()
const router = useRouter()

const id = computed(() => Number(route.params.id))

// Fetch existing data
const { data: quotation, isLoading } = useQuotation(id)

// Form state (populated from API data)
const form = ref({
  contact_id: null as number | null,
  valid_until: '',
  notes: '',
})

// Populate form when data loads
watch(quotation, (data) => {
  if (data) {
    form.value = {
      contact_id: data.contact?.id ?? null,
      valid_until: data.valid_until,
      notes: data.notes ?? '',
    }
  }
}, { immediate: true })

// Update mutation
const { mutate, isPending } = useUpdateQuotation()

function handleSubmit() {
  mutate(
    { id: id.value, data: form.value },
    {
      onSuccess: () => {
        toast.success('Saved')
        router.push(`/quotations/${id.value}`)
      },
    }
  )
}
</script>

<template>
  <LoadingSkeleton v-if="isLoading" />
  <Card v-else>
    <form @submit.prevent="handleSubmit">
      <!-- Form fields -->
    </form>
  </Card>
</template>
```

---

## VeeValidate + Zod Pattern

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// Define schema
const schema = toTypedSchema(
  z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
  })
)

// Setup form
const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: schema,
})

// Define fields
const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')
const [name, nameAttrs] = defineField('name')

// Submit handler
const onSubmit = handleSubmit((values) => {
  // values is typed: { email: string, password: string, name: string }
  console.log(values)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4">
    <FormField label="Name" :error="errors.name">
      <Input v-model="name" v-bind="nameAttrs" />
    </FormField>

    <FormField label="Email" :error="errors.email">
      <Input v-model="email" v-bind="emailAttrs" type="email" />
    </FormField>

    <FormField label="Password" :error="errors.password">
      <Input v-model="password" v-bind="passwordAttrs" type="password" />
    </FormField>

    <Button type="submit">Submit</Button>
  </form>
</template>
```

---

## Form Validation Errors from API

```typescript
// In mutation error handler
onError: (error) => {
  // Check for validation errors (422 response)
  if ('validationErrors' in error && error.validationErrors) {
    // validationErrors is Record<string, string[]>
    // e.g., { email: ['Email is required', 'Invalid format'] }

    Object.entries(error.validationErrors).forEach(([field, messages]) => {
      errors.value[field] = messages[0] // Take first error
    })
  } else {
    // Generic error
    toast.error(getErrorMessage(error))
  }
}
```

---

## Autosave Pattern

```vue
<script setup lang="ts">
import { useAutosave } from '@/composables/useAutosave'

const form = ref({
  title: '',
  content: '',
})

// Autosave to localStorage
const { isSaving, lastSaved } = useAutosave(
  'draft-quotation',
  form,
  { debounce: 1000 }
)
</script>

<template>
  <div>
    <form><!-- fields --></form>
    <p v-if="lastSaved" class="text-sm text-muted-foreground">
      Last saved: {{ formatRelativeTime(lastSaved) }}
    </p>
  </div>
</template>
```

---

## Dynamic Form Items

```vue
<script setup lang="ts">
const items = ref([
  { product_id: null, quantity: 1, price: 0 }
])

function addItem() {
  items.value.push({ product_id: null, quantity: 1, price: 0 })
}

function removeItem(index: number) {
  items.value.splice(index, 1)
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="flex gap-4 items-end"
    >
      <FormField label="Product" class="flex-1">
        <Select v-model="item.product_id" :options="productOptions" />
      </FormField>

      <FormField label="Quantity" class="w-24">
        <NumberInput v-model="item.quantity" :min="1" />
      </FormField>

      <FormField label="Price" class="w-40">
        <CurrencyInput v-model="item.price" />
      </FormField>

      <Button
        variant="ghost"
        size="icon"
        @click="removeItem(index)"
        :disabled="items.length === 1"
      >
        <Trash2 class="w-4 h-4" />
      </Button>
    </div>

    <Button variant="outline" @click="addItem">
      <Plus class="w-4 h-4 mr-2" />
      Add Item
    </Button>
  </div>
</template>
```

---

## Related Documentation

- [UI-COMPONENTS.md](UI-COMPONENTS.md) - Component reference
- [MUTATIONS.md](../api/MUTATIONS.md) - Form submission
- [ERROR-HANDLING.md](../api/ERROR-HANDLING.md) - Validation errors
