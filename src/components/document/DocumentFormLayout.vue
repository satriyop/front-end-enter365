<script setup lang="ts">
/**
 * DocumentFormLayout Component
 *
 * Standard layout for document form pages.
 * Provides consistent structure for header, content, and footer.
 *
 * @example
 * ```vue
 * <DocumentFormLayout
 *   title="New Quotation"
 *   :is-loading="isLoadingData"
 *   :is-submitting="isSubmitting"
 *   @submit="submit"
 *   @cancel="$router.back()"
 * >
 *   <template #header>
 *     <!-- Form header fields -->
 *   </template>
 *   <template #items>
 *     <!-- Line items table -->
 *   </template>
 *   <template #totals>
 *     <!-- Totals summary -->
 *   </template>
 * </DocumentFormLayout>
 * ```
 */

import { useSlots } from 'vue'
import { Button, Card } from '@/components/ui'
import { Loader2 } from 'lucide-vue-next'

interface Props {
  title: string
  subtitle?: string
  isLoading?: boolean
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  showSubmit?: boolean
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  isSubmitting: false,
  submitLabel: 'Save',
  cancelLabel: 'Cancel',
  showCancel: true,
  showSubmit: true,
})

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

const slots = useSlots()

function handleSubmit() {
  emit('submit')
}
</script>

<template>
  <div class="relative">
    <!-- Loading overlay -->
    <div
      v-if="isLoading"
      class="absolute inset-0 z-50 flex items-center justify-center bg-background/80"
    >
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>

    <form novalidate @submit.prevent="handleSubmit">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-semibold">{{ title }}</h1>
            <p v-if="subtitle" class="text-muted-foreground">{{ subtitle }}</p>
          </div>
          <slot name="header-actions" />
        </div>
      </div>

      <!-- Main content -->
      <div class="space-y-6">
        <!-- Header fields section -->
        <Card v-if="slots.header">
          <div class="p-6">
            <slot name="header" />
          </div>
        </Card>

        <!-- Line items section -->
        <Card v-if="slots.items">
          <div class="p-6">
            <h2 class="text-lg font-medium mb-4">Items</h2>
            <slot name="items" />
          </div>
        </Card>

        <!-- Additional sections -->
        <slot name="sections" />

        <!-- Notes and totals -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Notes -->
          <Card v-if="slots.notes">
            <div class="p-6">
              <h2 class="text-lg font-medium mb-4">Notes</h2>
              <slot name="notes" />
            </div>
          </Card>

          <!-- Totals -->
          <Card v-if="slots.totals" :class="!slots.notes ? 'lg:col-start-2' : ''">
            <div class="p-6">
              <h2 class="text-lg font-medium mb-4">Summary</h2>
              <slot name="totals" />
            </div>
          </Card>
        </div>

        <!-- Additional bottom content -->
        <slot name="bottom" />
      </div>

      <!-- Footer (sticky on mobile) -->
      <div
        class="sticky bottom-0 mt-6 -mx-4 px-4 py-4 bg-background border-t lg:static lg:mx-0 lg:px-0 lg:border-0"
      >
        <div class="flex justify-end gap-3">
          <slot name="footer-actions" />
          <Button
            v-if="showCancel"
            type="button"
            variant="outline"
            :disabled="isSubmitting"
            @click="emit('cancel')"
          >
            {{ cancelLabel }}
          </Button>
          <Button v-if="showSubmit" type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            {{ submitLabel }}
          </Button>
        </div>
      </div>
    </form>
  </div>
</template>
