<script setup lang="ts">
import { computed } from 'vue'
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
import { Button, Input, DateField, Select, Card, Modal, Pagination, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { POS_NAV_ID, posChrome } from '@/config/nav'
import { useFeaturesStore } from '@/stores/features'
import { Plus, Search, FileText, Calendar } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()
const features = useFeaturesStore()
const posPack = computed(() => features.preset === 'pos')
const title = computed(() => posChrome('Journal Entries', posPack.value, POS_NAV_ID))

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
const statusOptions = computed(() => [
  { value: '', label: posChrome('All Status', posPack.value) },
  { value: 'true', label: posChrome('Posted', posPack.value) },
  { value: 'false', label: posChrome('Draft', posPack.value) },
])

function handleStatusChange(value: string | number | null) {
  if (value === 'true') {
    updateFilter('is_posted', true)
  } else if (value === 'false') {
    updateFilter('is_posted', false)
  } else {
    updateFilter('is_posted', undefined)
  }
}

const columns = computed<ResponsiveColumn[]>(() => [
  { key: 'entry_number', label: posChrome('Entry #', posPack.value), mobilePriority: 1 },
  { key: 'entry_date', label: posChrome('Date', posPack.value), mobilePriority: 2 },
  { key: 'description', label: posChrome('Description', posPack.value), mobilePriority: 3 },
  { key: 'total_debit', label: posChrome('Debit', posPack.value), align: 'right', showInMobile: false },
  { key: 'total_credit', label: posChrome('Credit', posPack.value), align: 'right', showInMobile: false },
  { key: 'status', label: posChrome('Status', posPack.value), mobilePriority: 4 },
])

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
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h1>
        <p class="text-slate-500 dark:text-slate-400">{{ posPack ? 'Jurnal manual dan penyesuaian' : 'Manual journal entries and adjustments' }}</p>
      </div>
      <RouterLink to="/accounting/journal-entries/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          {{ posPack ? 'Buat jurnal' : 'New Entry' }}
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
            :placeholder="posPack ? 'Cari nomor atau uraian...' : 'Search by entry number or description...'"
            class="pl-9"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>

        <!-- Date Range -->
        <div class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-slate-400" />
          <DateField
            :model-value="filters.start_date"
            placeholder="dd/mm/yyyy"
            class="w-36"
            @update:model-value="(v) => updateFilter('start_date', v || undefined)"
          />
          <span class="text-slate-400">{{ posPack ? 's.d.' : 'to' }}</span>
          <DateField
            :model-value="filters.end_date"
            placeholder="dd/mm/yyyy"
            class="w-36"
            @update:model-value="(v) => updateFilter('end_date', v || undefined)"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-32">
          <Select
            :model-value="filters.is_posted === true ? 'true' : filters.is_posted === false ? 'false' : ''"
            :options="statusOptions"
            :placeholder="posChrome('All Status', posPack)"
            @update:model-value="handleStatusChange"
          />
        </div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-red-500">{{ posChrome('Failed to load journal entries', posPack) }}</p>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>{{ posChrome('Loading', posPack) }}</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="isEmpty" class="text-center py-12">
      <FileText class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">{{ posChrome('No journal entries found', posPack) }}</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        {{ posPack ? 'Buat jurnal manual untuk penyesuaian' : 'Create manual journal entries for adjustments and corrections' }}
      </p>
      <RouterLink to="/accounting/journal-entries/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          {{ posChrome('Create Entry', posPack) }}
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
          <div class="max-w-xl whitespace-normal break-words text-slate-600 dark:text-slate-400" :title="item.description">
            {{ item.description }}
            <span v-if="item.reference" class="text-slate-400 dark:text-slate-500 ml-1">
              ({{ item.reference }})
            </span>
          </div>
        </template>

        <!-- Debit -->
        <template #cell-total_debit="{ item }">
          <span class="font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {{ formatCurrency(item.total_debit) }}
          </span>
        </template>

        <!-- Credit -->
        <template #cell-total_credit="{ item }">
          <span class="font-mono tabular-nums text-slate-900 dark:text-slate-100">
            {{ formatCurrency(item.total_credit) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <span
            class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
            :class="getJournalEntryStatus(item).color"
          >
            {{ posChrome(getJournalEntryStatus(item).label, posPack) }}
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
              {{ posChrome('View', posPack) }}
            </Button>
            <Button
              v-if="!item.is_posted"
              variant="ghost"
              size="xs"
              class="text-red-500 hover:text-red-600"
              @click.stop="deleteConfirmation.confirmDelete(item.id)"
            >
              {{ posChrome('Delete', posPack) }}
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
      :title="posPack ? 'Hapus jurnal' : 'Delete Journal Entry'"
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
