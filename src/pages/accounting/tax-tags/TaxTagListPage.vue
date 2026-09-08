<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  taxTagApplicabilityLabel,
  useTaxTags,
  type TaxTag,
  type TaxTagFilters,
} from '@/api/useTaxTags'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()

const {
  items: tags,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<TaxTag, TaxTagFilters>({
  useListHook: useTaxTags,
  initialFilters: {
    page: 1,
    per_page: 50,
    search: '',
  },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'applicability', label: 'Grid', mobilePriority: 3 },
  { key: 'is_active', label: 'Status', mobilePriority: 4 },
]

function editTag(tag: TaxTag) {
  router.push(`/accounting/tax-tags/${tag.id}/edit`)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Tax Tags</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Master for journal entry Tax Grids (base / tax). VAT reports stay on invoices and bills.
        </p>
      </div>
      <Button data-testid="tax-tag-create" @click="router.push('/accounting/tax-tags/new')">
        <Plus class="w-4 h-4 mr-1" />
        New Tax Tag
      </Button>
    </div>

    <Card class="mb-4">
      <div class="flex flex-col sm:flex-row gap-3 p-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search ?? ''"
            class="pl-9"
            placeholder="Search code or name..."
            data-testid="tax-tag-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load tax tags</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No tax tags found</div>
      <ResponsiveTable
        v-else
        :items="tags ?? []"
        :columns="columns"
        :loading="isLoading"
        empty-message="No tax tags found"
        @row-click="editTag"
      >
        <template #cell-code="{ item }">
          <code class="text-sm">{{ item.code }}</code>
        </template>
        <template #cell-name="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
        </template>
        <template #cell-applicability="{ item }">
          <span class="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800">
            {{ taxTagApplicabilityLabel(item.applicability) }}
          </span>
        </template>
        <template #cell-is_active="{ item }">
          <span
            class="inline-flex px-2 py-0.5 rounded text-xs"
            :class="item.is_active
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'"
          >
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </span>
        </template>
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="editTag(item)">Edit</Button>
        </template>
      </ResponsiveTable>

      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="goToPage"
        />
      </div>
    </Card>
  </div>
</template>
