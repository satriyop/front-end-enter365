<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useJournals,
  useDeleteJournal,
  journalTypeLabel,
  JOURNAL_TYPE_OPTIONS,
  type Journal,
  type JournalFilters,
} from '@/api/useJournals'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Card, Modal, Pagination, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

const {
  items: journals,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<Journal, JournalFilters>({
  useListHook: useJournals,
  initialFilters: {
    page: 1,
    per_page: 50,
    search: '',
    type: undefined,
  },
})

const typeOptions = [
  { value: '', label: 'All Types' },
  ...JOURNAL_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

function handleTypeChange(value: string | number | null) {
  updateFilter('type', value ? (String(value) as JournalFilters['type']) : undefined)
}

const columns: ResponsiveColumn[] = [
  { key: 'name', label: 'Journal Name', mobilePriority: 1 },
  { key: 'type', label: 'Type', mobilePriority: 2 },
  { key: 'sequence_prefix', label: 'Sequence Prefix', mobilePriority: 3 },
  { key: 'currency', label: 'Currency', showInMobile: false },
  { key: 'is_active', label: 'Status', mobilePriority: 4 },
]

const deleteMutation = useDeleteJournal()

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (!id) return
  try {
    await deleteMutation.mutateAsync(id as number)
    toast.success('Journal deleted')
  } catch {
    toast.error('Failed to delete journal (it may be in use)')
  }
}

function editJournal(journal: Journal) {
  router.push(`/accounting/journals/${journal.id}/edit`)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Journals</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Configure sales, purchase, bank, cash, and miscellaneous journals
        </p>
      </div>
      <Button data-testid="journal-create" @click="router.push('/accounting/journals/new')">
        <Plus class="w-4 h-4 mr-1" />
        New Journal
      </Button>
    </div>

    <Card class="mb-4">
      <div class="flex flex-col sm:flex-row gap-3 p-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search ?? ''"
            class="pl-9"
            placeholder="Search journals..."
            data-testid="journal-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <Select
          :model-value="filters.type ?? ''"
          :options="typeOptions"
          class="sm:w-48"
          :test-id="'journal-type-filter'"
          @update:model-value="handleTypeChange"
        />
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load journals</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No journals found</div>
      <ResponsiveTable
        v-else
        :items="journals ?? []"
        :columns="columns"
        :loading="isLoading"
        empty-message="No journals found"
        @row-click="editJournal"
      >
        <template #cell-name="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
        </template>
        <template #cell-type="{ item }">
          <span class="inline-flex px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800">
            {{ journalTypeLabel(item.type) }}
          </span>
        </template>
        <template #cell-sequence_prefix="{ item }">
          <code class="text-sm">{{ item.sequence_prefix }}</code>
        </template>
        <template #cell-currency="{ item }">
          {{ item.currency || '—' }}
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
          <div class="flex items-center justify-end gap-2">
            <Button variant="ghost" size="xs" @click.stop="editJournal(item)">Edit</Button>
            <Button
              variant="ghost"
              size="xs"
              class="text-red-500 hover:text-red-600"
              @click.stop="deleteConfirmation.confirmDelete(item.id)"
            >
              Delete
            </Button>
          </div>
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

    <Modal
      :open="deleteConfirmation.showModal.value"
      title="Delete Journal"
      size="sm"
      @update:open="deleteConfirmation.showModal.value = $event"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Delete this journal? Journals with existing entries cannot be deleted.
      </p>
      <template #footer>
        <Button variant="ghost" @click="deleteConfirmation.cancelDelete()">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
