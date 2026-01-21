<script setup lang="ts">
/**
 * DocumentDetailLayout Component
 *
 * Standard layout for document detail pages.
 * Provides header with status, actions, and two-column content area.
 *
 * @example
 * ```vue
 * <DocumentDetailLayout
 *   title="Quotation"
 *   :document-number="quotation.quotation_number"
 *   :status="quotation.status"
 *   status-variant="success"
 *   :is-loading="isLoading"
 *   @back="$router.back()"
 *   @edit="navigateToEdit"
 * >
 *   <template #actions>
 *     <Button @click="approve">Approve</Button>
 *   </template>
 *   <template #info>
 *     <!-- Document info fields -->
 *   </template>
 *   <template #items>
 *     <!-- Line items table -->
 *   </template>
 *   <template #summary>
 *     <!-- Totals summary -->
 *   </template>
 * </DocumentDetailLayout>
 * ```
 */

import { useSlots } from 'vue'
import { Badge, Button, Card } from '@/components/ui'
import { Printer, Edit, ChevronLeft, Loader2 } from 'lucide-vue-next'

interface Props {
  title: string
  documentNumber: string
  status: string
  statusVariant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'primary'
  isLoading?: boolean
  isProcessing?: boolean
  showPrint?: boolean
  showEdit?: boolean
}

withDefaults(defineProps<Props>(), {
  statusVariant: 'secondary',
  isLoading: false,
  isProcessing: false,
  showPrint: true,
  showEdit: true,
})

const emit = defineEmits<{
  back: []
  edit: []
  print: []
}>()

const slots = useSlots()
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

    <!-- Header -->
    <div class="mb-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="emit('back')">
            <ChevronLeft class="h-5 w-5" />
          </Button>
          <div>
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-2xl font-semibold">{{ title }}</h1>
              <Badge :variant="statusVariant">{{ status }}</Badge>
            </div>
            <p class="text-muted-foreground">{{ documentNumber }}</p>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-wrap items-center gap-2 pl-14 sm:pl-0">
          <!-- Workflow actions slot -->
          <slot name="actions" :is-processing="isProcessing" />

          <!-- Standard actions -->
          <Button v-if="showPrint" variant="outline" size="sm" @click="emit('print')">
            <Printer class="h-4 w-4 mr-2" />
            Print
          </Button>

          <Button v-if="showEdit" variant="outline" size="sm" @click="emit('edit')">
            <Edit class="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content (2 columns) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Info section -->
        <Card v-if="slots.info">
          <div class="p-6">
            <slot name="info" />
          </div>
        </Card>

        <!-- Items section -->
        <Card v-if="slots.items">
          <div class="p-6">
            <h2 class="text-lg font-medium mb-4">Items</h2>
            <slot name="items" />
          </div>
        </Card>

        <!-- Additional main sections -->
        <slot name="main" />
      </div>

      <!-- Sidebar (1 column) -->
      <div class="space-y-6">
        <!-- Summary -->
        <Card v-if="slots.summary">
          <div class="p-6">
            <h2 class="text-lg font-medium mb-4">Summary</h2>
            <slot name="summary" />
          </div>
        </Card>

        <!-- Activity / History -->
        <Card v-if="slots.activity">
          <div class="p-6">
            <h2 class="text-lg font-medium mb-4">Activity</h2>
            <slot name="activity" />
          </div>
        </Card>

        <!-- Additional sidebar slots -->
        <slot name="sidebar" />
      </div>
    </div>

    <!-- Modals -->
    <slot name="modals" />
  </div>
</template>
