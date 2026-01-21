<script setup lang="ts">
/**
 * ListPageContainer Component
 *
 * Wrapper component for list pages that handles loading, empty, and error states.
 * Provides consistent UX across all list pages.
 *
 * @example
 * ```vue
 * <ListPageContainer
 *   :is-loading="isLoading"
 *   :show-empty="isEmpty"
 *   :show-error="hasError"
 *   :show-data="showData"
 *   :error="error"
 *   empty-title="No quotations yet"
 *   empty-description="Create your first quotation to get started."
 *   @retry="refresh"
 *   @create="$router.push({ name: 'quotation-new' })"
 * >
 *   <ResponsiveTable :items="items" :columns="columns" />
 * </ListPageContainer>
 * ```
 */

import { computed, type Component } from 'vue'
import { Button, Card } from '@/components/ui'
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-vue-next'

interface Props {
  isLoading?: boolean
  isRefreshing?: boolean
  showEmpty?: boolean
  showError?: boolean
  showData?: boolean
  error?: Error | null
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: Component
  showCreateButton?: boolean
  createButtonLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isRefreshing: false,
  showEmpty: false,
  showError: false,
  showData: true,
  emptyTitle: 'No items found',
  emptyDescription: 'Get started by creating a new item.',
  showCreateButton: true,
  createButtonLabel: 'Create New',
})

const emit = defineEmits<{
  retry: []
  create: []
}>()

// Use provided icon or default to Inbox
const EmptyIcon = computed(() => props.emptyIcon || Inbox)
</script>

<template>
  <div class="relative">
    <!-- Refresh indicator -->
    <div
      v-if="isRefreshing && !isLoading"
      class="absolute top-0 left-0 right-0 z-10 flex justify-center"
    >
      <div
        class="bg-primary text-primary-foreground px-3 py-1 rounded-b-lg text-sm flex items-center gap-2"
      >
        <Loader2 class="h-3 w-3 animate-spin" />
        Refreshing...
      </div>
    </div>

    <!-- Loading state -->
    <Card v-if="isLoading" class="p-12">
      <div class="flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 class="h-8 w-8 animate-spin mb-4" />
        <p>Loading...</p>
      </div>
    </Card>

    <!-- Error state -->
    <Card v-else-if="showError" class="p-12">
      <div class="flex flex-col items-center justify-center text-center">
        <AlertCircle class="h-12 w-12 text-destructive mb-4" />
        <h3 class="text-lg font-medium mb-2">Failed to load data</h3>
        <p class="text-muted-foreground mb-4 max-w-md">
          {{ error?.message || 'An unexpected error occurred. Please try again.' }}
        </p>
        <Button variant="outline" @click="emit('retry')">
          <RefreshCw class="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </Card>

    <!-- Empty state -->
    <Card v-else-if="showEmpty" class="p-12">
      <div class="flex flex-col items-center justify-center text-center">
        <component :is="EmptyIcon" class="h-12 w-12 text-muted-foreground mb-4" />
        <h3 class="text-lg font-medium mb-2">{{ emptyTitle }}</h3>
        <p class="text-muted-foreground mb-4 max-w-md">
          {{ emptyDescription }}
        </p>
        <slot name="empty-action">
          <Button v-if="showCreateButton" @click="emit('create')">
            {{ createButtonLabel }}
          </Button>
        </slot>
      </div>
    </Card>

    <!-- Data state -->
    <template v-else-if="showData">
      <slot />
    </template>
  </div>
</template>
