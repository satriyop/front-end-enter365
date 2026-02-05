<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useProductCategory,
  useCreateProductCategory,
  useUpdateProductCategory,
  useProductCategoriesLookup,
  type CreateProductCategoryData,
} from '@/api/useProductCategories'
import { getErrorMessage } from '@/api/client'
import { productCategorySchema, type ProductCategoryFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  PageSkeleton,
  useToast
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const categoryId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => categoryId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Category' : 'New Category')

// Fetch existing category if editing
const categoryIdRef = computed(() => categoryId.value ?? 0)
const { data: existingCategory, isLoading: loadingCategory } = useProductCategory(categoryIdRef)

// Fetch parent categories for dropdown
const { data: allCategories } = useProductCategoriesLookup()

// Filter out current category and its descendants when editing
const parentOptions = computed(() => {
  const options = [{ value: '', label: 'No Parent (Root Category)' }]

  if (!allCategories.value) return options

  // When editing, exclude the current category and its descendants
  const categoriesToExclude = new Set<number>()
  if (isEditing.value && categoryId.value) {
    categoriesToExclude.add(categoryId.value)
    // Also exclude descendants to prevent circular references
    const findDescendants = (parentId: number) => {
      allCategories.value?.forEach(c => {
        if (c.parent_id === parentId) {
          categoriesToExclude.add(c.id)
          findDescendants(c.id)
        }
      })
    }
    findDescendants(categoryId.value)
  }

  allCategories.value.forEach(category => {
    if (!categoriesToExclude.has(category.id)) {
      options.push({ value: String(category.id), label: category.name })
    }
  })

  return options
})

// Form with Zod validation
const { errors, handleSubmit, setValues, setErrors, meta, validateField, defineField } = useForm<ProductCategoryFormData>({
  validationSchema: toTypedSchema(productCategorySchema),
  initialValues: {
    code: '',
    name: '',
    description: '',
    parent_id: null,
    is_active: true,
    sort_order: 0,
  },
})

const [code] = defineField('code')
const [name] = defineField('name')
const [description] = defineField('description')
const [parentId] = defineField('parent_id')
const [isActive] = defineField('is_active')
const [sortOrder] = defineField('sort_order')

// Populate form when editing
watch(existingCategory, (category) => {
  if (category) {
    setValues({
      code: category.code || '',
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id,
      is_active: !!category.is_active,
      sort_order: category.sort_order ?? 0,
    })
  }
}, { immediate: true })

// Form submission
const createMutation = useCreateProductCategory()
const updateMutation = useUpdateProductCategory()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  const payload: CreateProductCategoryData = {
    code: formValues.code || null,
    name: formValues.name,
    description: formValues.description || null,
    parent_id: formValues.parent_id || null,
    is_active: formValues.is_active ?? true,
    sort_order: formValues.sort_order ?? 0,
  }

  try {
    if (isEditing.value && categoryId.value) {
      await updateMutation.mutateAsync({ id: categoryId.value, data: payload })
      toast.success('Category updated successfully')
      router.push(`/settings/product-categories/${categoryId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Category created successfully')
      router.push(`/settings/product-categories/${result.id}`)
    }
  } catch (err: unknown) {
    // Handle server validation errors
    const error = err as { validationErrors?: Record<string, string[]> }
    if (error.validationErrors) {
      setServerErrors({ setErrors } as any, error.validationErrors)
    }
    toast.error(getErrorMessage(err, 'Failed to save category'))
  }
})

// Keyboard shortcut: Ctrl+S to save
useFormShortcuts({
  onSave: async () => { await onSubmit() },
  onCancel: () => router.back(),
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ pageTitle }}</h1>
        <p class="text-muted-foreground">
          {{ isEditing ? 'Update category information' : 'Create a new product category' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <kbd class="hidden sm:inline-flex px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border">
          Ctrl+S to save
        </kbd>
        <Button variant="ghost" @click="router.back()">
          Cancel
        </Button>
      </div>
    </div>

    <!-- Loading state for edit mode -->
    <PageSkeleton v-if="isEditing && loadingCategory" type="form" />

    <!-- Form -->
    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Basic Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Code" :error="errors.code" hint="Leave empty for auto-generated code">
            <Input
              v-model="code"
              placeholder="e.g., CAT-001"
              @blur="validateField('code')"
            />
          </FormField>

          <FormField label="Name" required :error="errors.name">
            <Input
              v-model="name"
              placeholder="e.g., Solar Panels"
              @blur="validateField('name')"
            />
          </FormField>

          <FormField label="Parent Category" :error="errors.parent_id" class="md:col-span-2">
            <Select
              :model-value="parentId ?? ''"
              :options="parentOptions"
              @update:model-value="(v) => parentId = v ? Number(v) : null"
            />
          </FormField>

          <FormField label="Description" :error="errors.description" class="md:col-span-2">
            <Textarea
              v-model="description"
              :rows="3"
              placeholder="Category description"
            />
          </FormField>
        </div>
      </Card>

      <!-- Settings -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Settings</h2>
        </template>

        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Sort Order" :error="errors.sort_order" hint="Lower numbers appear first">
              <Input
                v-model.number="sortOrder"
                type="number"
                min="0"
                @blur="validateField('sort_order')"
              />
            </FormField>
          </div>

          <!-- Active Status Toggle -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-foreground">Active Status</h3>
              <p class="text-sm text-muted-foreground">Inactive categories won't appear in lookups</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="isActive"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </Card>

      <!-- Form Status Indicator -->
      <div v-if="meta.dirty" class="text-sm text-amber-600 dark:text-amber-500">
        You have unsaved changes
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Category' : 'Create Category' }}
        </Button>
      </div>
    </form>
  </div>
</template>
