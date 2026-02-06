<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  useRecurringTemplates,
  useDeleteRecurringTemplate,
  usePauseTemplate,
  useResumeTemplate,
  useGenerateFromTemplate,
  getIntervalLabel,
  type RecurringTemplate,
  type RecurringTemplateFilters,
  type RecurringFrequency,
} from '@/api/useRecurringTemplates'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  Pagination,
  useToast,
  ResponsiveTable,
  Badge,
  type ResponsiveColumn,
} from '@/components/ui'
import {
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Calendar,
  Zap,
} from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Resource list with filters and pagination
const {
  items: templates,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<RecurringTemplate, RecurringTemplateFilters>({
  useListHook: useRecurringTemplates,
  initialFilters: {
    page: 1,
    per_page: 20,
    search: '',
    type: undefined,
    is_active: undefined,
  },
})

// Filter options
const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'bill', label: 'Bill' },
]

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Paused' },
]

function handleTypeChange(value: string | number | null) {
  updateFilter('type', value ? (value as 'invoice' | 'bill') : undefined)
}

function handleStatusChange(value: string | number | null) {
  updateFilter('is_active', value === '' ? undefined : value === 'true')
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'name', label: 'Template Name', mobilePriority: 1 },
  { key: 'type', label: 'Type', mobilePriority: 2 },
  { key: 'contact', label: 'Contact', showInMobile: false },
  { key: 'frequency', label: 'Frequency', mobilePriority: 3 },
  { key: 'amount', label: 'Amount', align: 'right', showInMobile: false },
  { key: 'next_date', label: 'Next Run', mobilePriority: 4 },
  { key: 'status', label: 'Status', showInMobile: false },
]

// Mutations
const deleteMutation = useDeleteRecurringTemplate()
const pauseMutation = usePauseTemplate()
const resumeMutation = useResumeTemplate()
const generateMutation = useGenerateFromTemplate()

// Modal states
const showDeleteModal = ref(false)
const selectedTemplate = ref<RecurringTemplate | null>(null)

function openDeleteModal(template: RecurringTemplate) {
  selectedTemplate.value = template
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedTemplate.value) return

  try {
    await deleteMutation.mutateAsync(selectedTemplate.value.id)
    showDeleteModal.value = false
    selectedTemplate.value = null
    toast.success('Template deleted')
  } catch {
    toast.error('Failed to delete template')
  }
}

async function handlePause(template: RecurringTemplate) {
  try {
    await pauseMutation.mutateAsync(template.id)
    toast.success('Template paused')
  } catch {
    toast.error('Failed to pause template')
  }
}

async function handleResume(template: RecurringTemplate) {
  try {
    await resumeMutation.mutateAsync(template.id)
    toast.success('Template resumed')
  } catch {
    toast.error('Failed to resume template')
  }
}

async function handleGenerate(template: RecurringTemplate) {
  try {
    await generateMutation.mutateAsync(template.id)
    toast.success(`${template.type === 'invoice' ? 'Invoice' : 'Bill'} generated`)
  } catch {
    toast.error('Failed to generate document')
  }
}

// Navigate to detail
function viewTemplate(template: RecurringTemplate) {
  router.push(`/accounting/recurring-templates/${template.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Recurring Templates</h1>
        <p class="text-slate-500 dark:text-slate-400">Automate invoice and bill creation</p>
      </div>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search templates..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>

        <!-- Type Filter -->
        <div class="w-40">
          <Select
            :model-value="filters.type ?? ''"
            :options="typeOptions"
            placeholder="All Types"
            @update:model-value="handleTypeChange"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <Select
            :model-value="filters.is_active === undefined ? '' : String(filters.is_active)"
            :options="statusOptions"
            placeholder="All Status"
            @update:model-value="handleStatusChange"
          />
        </div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-red-500">Failed to load templates</p>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <RefreshCw class="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="isEmpty" class="text-center py-12">
      <Calendar class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No recurring templates</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create recurring invoices or bills from existing documents
      </p>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="templates"
        :columns="columns"
        :loading="isLoading"
        title-field="name"
        @row-click="viewTemplate"
      >
        <!-- Name -->
        <template #cell-name="{ item }">
          <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</div>
        </template>

        <!-- Type -->
        <template #cell-type="{ item }">
          <Badge :variant="item.type === 'invoice' ? 'default' : 'secondary'">
            {{ item.type === 'invoice' ? 'Invoice' : 'Bill' }}
          </Badge>
        </template>

        <!-- Contact -->
        <template #cell-contact="{ item }">
          <span class="text-slate-600 dark:text-slate-400">{{ item.contact?.name ?? '-' }}</span>
        </template>

        <!-- Frequency -->
        <template #cell-frequency="{ item }">
          <span class="text-slate-900 dark:text-slate-100">
            {{ getIntervalLabel(item.frequency as RecurringFrequency, item.interval) }}
          </span>
        </template>

        <!-- Amount - calculated from discount if available -->
        <template #cell-amount="{ item }">
          <span class="font-mono text-slate-900 dark:text-slate-100">
            {{ formatCurrency(item.discount_amount ?? 0) }}
          </span>
        </template>

        <!-- Next Date -->
        <template #cell-next_date="{ item }">
          <span v-if="item.next_generate_date" class="text-slate-600 dark:text-slate-400">
            {{ formatDate(item.next_generate_date) }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :variant="item.is_active ? 'success' : 'secondary'">
            {{ item.is_active ? 'Active' : 'Paused' }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :variant="item.is_active ? 'success' : 'secondary'">
            {{ item.is_active ? 'Active' : 'Paused' }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <!-- Generate Now -->
            <Button
              variant="ghost"
              size="xs"
              title="Generate now"
              :loading="generateMutation.isPending.value"
              @click.stop="handleGenerate(item)"
            >
              <Zap class="w-3.5 h-3.5" />
            </Button>

            <!-- Pause/Resume -->
            <Button
              v-if="item.is_active"
              variant="ghost"
              size="xs"
              title="Pause"
              :loading="pauseMutation.isPending.value"
              @click.stop="handlePause(item)"
            >
              <Pause class="w-3.5 h-3.5" />
            </Button>
            <Button
              v-else
              variant="ghost"
              size="xs"
              title="Resume"
              :loading="resumeMutation.isPending.value"
              @click.stop="handleResume(item)"
            >
              <Play class="w-3.5 h-3.5" />
            </Button>

            <!-- Delete -->
            <Button
              variant="ghost"
              size="xs"
              title="Delete"
              @click.stop="openDeleteModal(item)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>

            <!-- View -->
            <Button variant="ghost" size="xs" @click.stop="viewTemplate(item)">
              View
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

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Template" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete <strong>{{ selectedTemplate?.name }}</strong>?
        This will stop all future automatic generation.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          <Trash2 class="w-4 h-4 mr-2" />
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
