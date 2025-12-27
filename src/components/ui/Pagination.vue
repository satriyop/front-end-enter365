<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentPage: number
  totalPages: number
  totalItems?: number
  perPage?: number
  perPageOptions?: number[]
  showPerPage?: boolean
  showInfo?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  perPage: 25,
  perPageOptions: () => [10, 25, 50, 100],
  showPerPage: true,
  showInfo: true,
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:perPage': [perPage: number]
}>()

// Calculate visible page numbers
const visiblePages = computed(() => {
  const pages: (number | 'ellipsis')[] = []
  const total = props.totalPages
  const current = props.currentPage

  if (total <= 7) {
    // Show all pages
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (current > 3) {
      pages.push('ellipsis')
    }

    // Show pages around current
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('ellipsis')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})

// Calculate showing info
const showingFrom = computed(() => {
  if (!props.totalItems) return null
  return (props.currentPage - 1) * props.perPage + 1
})

const showingTo = computed(() => {
  if (!props.totalItems) return null
  return Math.min(props.currentPage * props.perPage, props.totalItems)
})

function goToPage(page: number) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}

function handlePerPageChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:perPage', Number(target.value))
  // Reset to page 1 when changing per page
  emit('update:currentPage', 1)
}
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
    <!-- Info section -->
    <div
      v-if="showInfo && totalItems"
      class="text-sm text-slate-500"
    >
      Showing {{ showingFrom }} to {{ showingTo }} of {{ totalItems }} results
    </div>

    <div class="flex items-center gap-4">
      <!-- Per page selector -->
      <div
        v-if="showPerPage"
        class="flex items-center gap-2"
      >
        <label class="text-sm text-slate-500">Show</label>
        <select
          :value="perPage"
          class="h-8 rounded-sm border border-slate-300 bg-white px-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          @change="handlePerPageChange"
        >
          <option
            v-for="option in perPageOptions"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
        <span class="text-sm text-slate-500">per page</span>
      </div>

      <!-- Page navigation -->
      <nav
        class="flex items-center gap-1"
        aria-label="Pagination"
      >
        <!-- Previous button -->
        <button
          type="button"
          :disabled="currentPage <= 1"
          class="flex items-center justify-center w-8 h-8 rounded-sm border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="goToPage(currentPage - 1)"
        >
          <span class="sr-only">Previous</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <!-- Page numbers -->
        <template v-for="page in visiblePages" :key="page">
          <span
            v-if="page === 'ellipsis'"
            class="px-2 text-slate-400"
          >
            ...
          </span>
          <button
            v-else
            type="button"
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-sm text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-orange-500 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            ]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </template>

        <!-- Next button -->
        <button
          type="button"
          :disabled="currentPage >= totalPages"
          class="flex items-center justify-center w-8 h-8 rounded-sm border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="goToPage(currentPage + 1)"
        >
          <span class="sr-only">Next</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>
