<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useJournalEntries,
  useDeleteJournalEntry,
  getJournalEntryStatus,
  type JournalEntry,
  type JournalEntryFilters,
} from '@/api/useJournalEntries'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Input, Select, Card, Modal, Pagination, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search, FileText, Calendar } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Resource list with filters and pagination
const {
  items: entries,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<JournalEntry, JournalEntryFilters>({
  useListHook: useJournalEntries,
  initialFilters: {
    page: 1,
    per_page: 20,
    search: '',
    is_posted: undefined,
    start_date: undefined,
    end_date: undefined,
  },
})

// Status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Posted' },
  { value: 'false', label: 'Draft' },
]

function handleStatusChange(value: string | number | null) {
  if (value === 'true') {
    updateFilter('is_posted', true)
  } else if (value === 'false') {
    updateFilter('is_posted', false)
  } else {
    updateFilter('is_posted', undefined)
  }
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'entry_number', label: 'Entry #', mobilePriority: 1 },
  { key: 'entry_date', label: 'Date', mobilePriority: 2 },
  { key: 'description', label: 'Description', mobilePriority: 3 },
  { key: 'total_debit', label: 'Debit', showInMobile: false },
  { key: 'total_credit', label: 'Credit', showInMobile: false },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]

// Delete handling
const deleteMutation = useDeleteJournalEntry()

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (!id) return

  try {
    await deleteMutation.mutateAsync(id as number)
    toast.success('Journal entry deleted')
  } catch {
    toast.error('Failed to delete journal entry')
  }
}

// Navigate to detail
function viewEntry(entry: JournalEntry) {
  router.push(`/accounting/journal-entries/${entry.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Journal Entries</h1>
        <p class="text-slate-500 dark:text-slate-400">Manual journal entries and adjustments</p>
      </div>
      <RouterLink to="/accounting/journal-entries/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px] relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search"
            placeholder="Search by entry number or description..."
            class="pl-9"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>

        <!-- Date Range -->
        <div class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.start_date"
            type="date"
            placeholder="Start Date"
            class="w-36"
            @update:model-value="(v) => updateFilter('start_date', v as string)"
          />
          <span class="text-slate-400">to</span>
          <Input
            :model-value="filters.end_date"
            type="date"
            placeholder="End Date"
            class="w-36"
            @update:model-value="(v) => updateFilter('end_date', v as string)"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-32">
          <Select
            :model-value="filters.is_posted === true ? 'true' : filters.is_posted === false ? 'false' : ''"
            :options="statusOptions"
            placeholder="All Status"
            @update:model-value="handleStatusChange"
          />
        </div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-red-500">Failed to load journal entries</p>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="isEmpty" class="text-center py-12">
      <FileText class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No journal entries found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create manual journal entries for adjustments and corrections
      </p>
      <RouterLink to="/accounting/journal-entries/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Entry
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="entries"
        :columns="columns"
        :loading="isLoading"
        title-field="entry_number"
        subtitle-field="description"
        @row-click="viewEntry"
      >
        <!-- Entry Number -->
        <template #cell-entry_number="{ item }">
          <span class="font-mono text-orange-600 dark:text-orange-400 font-medium">
            {{ item.entry_number }}
          </span>
        </template>

        <!-- Date -->
        <template #cell-entry_date="{ item }">
          <span class="text-slate-900 dark:text-slate-100">
            {{ formatDate(item.entry_date) }}
          </span>
        </template>

        <!-- Description -->
        <template #cell-description="{ item }">
          <div class="max-w-xs truncate text-slate-600 dark:text-slate-400">
            {{ item.description }}
            <span v-if="item.reference" class="text-slate-400 dark:text-slate-500 ml-1">
              ({{ item.reference }})
            </span>
          </div>
        </template>

        <!-- Debit -->
        <template #cell-total_debit="{ item }">
          <span class="font-mono text-slate-900 dark:text-slate-100">
            {{ formatCurrency(item.total_debit) }}
          </span>
        </template>

        <!-- Credit -->
        <template #cell-total_credit="{ item }">
          <span class="font-mono text-slate-900 dark:text-slate-100">
            {{ formatCurrency(item.total_credit) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <span
            class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
            :class="getJournalEntryStatus(item).color"
          >
            {{ getJournalEntryStatus(item).label }}
          </span>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="font-mono text-orange-600 dark:text-orange-400">
            {{ item.entry_number }}
          </span>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <Button variant="ghost" size="xs" @click.stop="viewEntry(item)">
              View
            </Button>
            <Button
              v-if="!item.is_posted"
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

      <!-- Pagination -->
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

    <!-- Delete Confirmation Modal -->
    <Modal
      :open="deleteConfirmation.showModal.value"
      title="Delete Journal Entry"
      size="sm"
      @update:open="deleteConfirmation.showModal.value = $event"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this journal entry? This action cannot be undone.
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
