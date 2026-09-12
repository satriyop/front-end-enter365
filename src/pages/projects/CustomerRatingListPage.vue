<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useCustomerRatings,
  type CustomerRating,
  type CustomerRatingFilters,
} from '@/api/useCustomerRatings'
import { useCustomerRatingsReport } from '@/api/useTaskAnalysis'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatDate } from '@/utils/format'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()
const { data: summary } = useCustomerRatingsReport()
const {
  items,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<CustomerRating, CustomerRatingFilters>({
  useListHook: useCustomerRatings,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'project', label: 'Project', mobilePriority: 1 },
  { key: 'rating', label: 'Rating', mobilePriority: 2 },
  { key: 'contact', label: 'Customer', mobilePriority: 3 },
  { key: 'comment', label: 'Comment', showInMobile: false },
  { key: 'rated_at', label: 'Rated', mobilePriority: 4 },
]

function subject(rating: CustomerRating): string {
  if (rating.rateable?.type === 'task') {
    return rating.rateable.title || 'Task'
  }
  return rating.project?.name || 'Project'
}

function openRating(rating: CustomerRating) {
  router.push('/projects/customer-ratings/' + rating.id + '/edit')
}

function createRating() {
  router.push('/projects/customer-ratings/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Customer Ratings</h1>
        <p class="text-slate-500 dark:text-slate-400">Recorded 1–5 scores on projects and tasks.</p>
      </div>
      <Button data-testid="customer-rating-create" @click="createRating">
        <Plus class="w-4 h-4 mr-1" />
        New Rating
      </Button>
    </div>
    <div v-if="summary" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <Card class="p-6 text-center">
        <div class="text-3xl font-bold">{{ summary.totals.count }}</div>
        <div class="text-sm text-muted-foreground mt-1">Ratings</div>
      </Card>
      <Card class="p-6 text-center">
        <div class="text-3xl font-bold">{{ summary.totals.average ?? '—' }}</div>
        <div class="text-sm text-muted-foreground mt-1">Average</div>
      </Card>
    </div>
    <Card class="mb-4">
      <div class="p-4 relative">
        <Search class="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          :model-value="filters.search ?? ''"
          class="pl-9"
          placeholder="Search comments..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </div>
    </Card>
    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load ratings</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No customer ratings found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openRating"
      >
        <template #cell-project="{ item }">{{ subject(item) }}</template>
        <template #cell-rating="{ item }">{{ item.rating }} / 5</template>
        <template #cell-contact="{ item }">{{ item.contact?.name ?? '—' }}</template>
        <template #cell-rated_at="{ item }">{{ item.rated_at ? formatDate(item.rated_at) : '—' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
