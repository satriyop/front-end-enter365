<script setup lang="ts">
import { ref } from 'vue'
import { useQuotations, type Quotation, type QuotationFilters } from '@/api/useQuotations'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { Plus, ChevronDown, FileText, Package, MoreVertical } from 'lucide-vue-next'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'radix-vue'

// Components
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'
import { ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import CreateQuotationFromBomModal from '@/components/quotations/CreateQuotationFromBomModal.vue'

// Resource list with filters and pagination
const {
  items: quotations,
  pagination,
  isLoading,
  error,
  filters,
  updateFilter,
} = useResourceList<Quotation, QuotationFilters>({
  useListHook: useQuotations,
  initialFilters: {
    page: 1,
    per_page: 10,
    status: '',
    search: '',
  },
})

// Dropdown and modal state
const showNewDropdown = ref(false)
const showFromBomModal = ref(false)

// Status options for select
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'converted', label: 'Converted' },
]

// Map status to Badge status prop
type BadgeStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired' | 'converted'
function getStatusLabel(status: any): string {
  if (status && typeof status === 'object') return status.label
  const labels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    expired: 'Expired',
    converted: 'Converted',
  }
  return labels[status] ?? status
}

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'quotation_number', label: 'Quotation #', mobilePriority: 1 },
  { key: 'contact.name', label: 'Customer', mobilePriority: 2 },
  { key: 'total', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'valid_until', label: 'Valid Until', showInMobile: false, format: (v) => formatDate(v as string) },
]
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Quotations</h1>
        <p class="text-muted-foreground">Manage sales quotations and proposals</p>
      </div>

      <!-- New Quotation Dropdown -->
      <DropdownMenuRoot v-model:open="showNewDropdown">
        <DropdownMenuTrigger as-child>
          <Button :icon="Plus">
            New Quotation
            <ChevronDown class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent
            class="z-50 min-w-[14rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
            :side-offset="4"
            align="end"
          >
            <DropdownMenuItem
              as-child
              class="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
            >
              <RouterLink to="/quotations/new">
                <FileText class="h-5 w-5 text-muted-foreground" />
                <div>
                  <div class="font-medium">Manual Entry</div>
                  <div class="text-xs text-muted-foreground">Create from scratch</div>
                </div>
              </RouterLink>
            </DropdownMenuItem>

            <DropdownMenuItem
              class="relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
              @select="showFromBomModal = true"
            >
              <Package class="h-5 w-5 text-muted-foreground" />
              <div>
                <div class="font-medium">From BOM</div>
                <div class="text-xs text-muted-foreground">Generate from Bill of Materials</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search quotations..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </FilterGroup>

      <FilterGroup min-width="150px">
        <Select
          v-model="filters.status"
          :options="statusOptions"
          placeholder="Status"
        />
      </FilterGroup>
    </FilterBar>

    <!-- Table -->
    <Card :padding="false">
      <!-- Loading State -->
      <div v-if="isLoading" class="p-8 text-center text-muted-foreground">
        Loading...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-8 text-center text-destructive">
        Failed to load quotations
      </div>

      <!-- Empty State -->
      <div v-else-if="quotations.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-2">📋</div>
        <div class="font-medium">No quotations found</div>
        <div class="text-muted-foreground text-sm">Create your first quotation to get started</div>
      </div>

      <!-- Data Table -->
      <ResponsiveTable
        v-if="quotations.length > 0"
        :items="quotations"
        :columns="columns"
        :loading="isLoading"
        title-field="quotation_number"
        subtitle-field="contact.name"
        status-field="status"
        @row-click="(item) => $router.push(`/quotations/${item.id}`)"
      >
        <!-- Custom cell: Quotation number with link styling -->
        <template #cell-quotation_number="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.quotation_number }}
          </span>
        </template>

        <!-- Custom cell: Customer with subject -->
        <template #cell-contact\.name="{ item }">
          <div class="font-medium">{{ item.contact?.name }}</div>
          <div class="text-sm text-muted-foreground">{{ item.subject }}</div>
        </template>

        <!-- Custom cell: Status badge -->
        <template #cell-status="{ item }">
          <Badge :status="item.status" dot>
            {{ item.status_label || getStatusLabel(item.status) }}
          </Badge>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :status="item.status" dot>
            {{ item.status_label || getStatusLabel(item.status) }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.quotation_number }}
          </span>
        </template>

        <!-- Actions -->
        <template #actions>
          <Button variant="ghost" size="icon-sm">
            <MoreVertical class="h-4 w-4" />
          </Button>
        </template>
      </ResponsiveTable>

      <!-- Pagination -->
      <div
        v-if="pagination"
        class="px-6 py-4 border-t flex items-center justify-between"
      >
        <div class="text-sm text-muted-foreground">
          Showing {{ (pagination.current_page - 1) * pagination.per_page + 1 }}
          to {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}
          of {{ pagination.total }}
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.current_page === 1"
            @click="filters.page = pagination.current_page - 1"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.current_page === pagination.last_page"
            @click="filters.page = pagination.current_page + 1"
          >
            Next
          </Button>
        </div>
      </div>
    </Card>

    <!-- Create from BOM Modal -->
    <CreateQuotationFromBomModal v-model:open="showFromBomModal" />
  </div>
</template>
