<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useFollowUpLevels, type FollowUpLevel, type FollowUpLevelFilters } from '@/api/useFollowUpLevels'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()
const {
  items,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<FollowUpLevel, FollowUpLevelFilters>({
  useListHook: useFollowUpLevels,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'name', label: 'Name', mobilePriority: 1 },
  { key: 'delay_days', label: 'Days', mobilePriority: 2 },
  { key: 'send_email', label: 'Email', mobilePriority: 3 },
  { key: 'is_active', label: 'Status', showInMobile: false },
]

function openLevel(level: FollowUpLevel) {
  router.push('/accounting/follow-up-levels/' + level.id + '/edit')
}

function createLevel() {
  router.push('/accounting/follow-up-levels/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Follow-up Levels</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Dunning steps after the invoice due date. Negative days send a reminder before due.
        </p>
      </div>
      <Button data-testid="follow-up-level-create" @click="createLevel">
        <Plus class="w-4 h-4 mr-1" />
        New Level
      </Button>
    </div>
    <Card class="mb-4">
      <div class="p-4 relative">
        <Search class="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          :model-value="filters.search ?? ''"
          class="pl-9"
          placeholder="Search name..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </div>
    </Card>
    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load follow-up levels</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No follow-up levels found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openLevel"
      >
        <template #cell-delay_days="{ item }">{{ item.delay_days }}</template>
        <template #cell-send_email="{ item }">{{ item.send_email ? 'Yes' : 'No' }}</template>
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
