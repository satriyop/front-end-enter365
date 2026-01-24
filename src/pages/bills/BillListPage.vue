<script setup lang="ts">
import { useBills, useDeleteBill, type BillFilters, type Bill } from '@/api/useBills'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const toast = useToast()

// Resource list with filters, pagination, and delete confirmation
const {
  items: bills,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<Bill, BillFilters>({
  useListHook: useBills,
  initialFilters: {
    page: 1,
    per_page: 10,
    status: undefined,
    search: '',
  },
})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'posted', label: 'Posted' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'destructive'> = {
  draft: 'default',
  posted: 'info',
  partial: 'warning',
  paid: 'success',
  overdue: 'destructive',
  voided: 'destructive',
}

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'bill_number', label: 'Bill #', mobilePriority: 1 },
  { key: 'contact.name', label: 'Vendor', mobilePriority: 2 },
  { key: 'bill_date', label: 'Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'due_date', label: 'Due Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'total_amount', label: 'Total', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'status', label: 'Status', showInMobile: false },
]

// Delete handling
const deleteMutation = useDeleteBill()

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (!id) return

  try {
    await deleteMutation.mutateAsync(id as number)
    toast.success('Bill deleted')
  } catch {
    toast.error('Failed to delete bill')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Bills</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage supplier bills and payables</p>
      </div>
      <RouterLink to="/bills/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Bill
        </Button>
      </RouterLink>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search bills..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <div class="w-40">
          <Select v-model="filters.status" :options="statusOptions" placeholder="All Status" />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500 dark:text-red-400">Failed to load bills</p>
    </div>

    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <div v-else-if="isEmpty" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No bills found"
        description="Record supplier bills to track payables"
        action-label="New Bill"
        @action="$router.push('/bills/new')"
      />
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="bills"
        :columns="columns"
        :loading="isLoading"
        title-field="bill_number"
        subtitle-field="contact.name"
        status-field="status"
        @row-click="(item) => $router.push(`/bills/${item.id}`)"
      >
        <!-- Custom cell: Bill number -->
        <template #cell-bill_number="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.bill_number }}
          </span>
        </template>

        <!-- Custom cell: Vendor -->
        <template #cell-contact\.name="{ item }">
          {{ item.contact?.name ?? '-' }}
        </template>

        <!-- Custom cell: Status -->
        <template #cell-status="{ item }">
          <Badge :status="item.status">
            {{ item.status.label }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.bill_number }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :status="item.status">
            {{ item.status.label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <RouterLink :to="`/bills/${item.id}/edit`">
              <Button variant="ghost" size="xs">Edit</Button>
            </RouterLink>
            <Button
              v-if="item.status.value === 'draft'"
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
    </div>

    <Modal :open="deleteConfirmation.showModal.value" title="Delete Bill" size="sm" @update:open="deleteConfirmation.showModal.value = $event">
      <p class="text-slate-600 dark:text-slate-400">Are you sure you want to delete this bill?</p>
      <template #footer>
        <Button variant="ghost" @click="deleteConfirmation.cancelDelete()">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
