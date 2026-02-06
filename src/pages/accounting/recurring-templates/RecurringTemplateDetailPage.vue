<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useRecurringTemplate,
  useDeleteRecurringTemplate,
  usePauseTemplate,
  useResumeTemplate,
  useGenerateFromTemplate,
  getIntervalLabel,
  type RecurringFrequency,
} from '@/api/useRecurringTemplates'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Badge, Modal, useToast } from '@/components/ui'
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Zap,
  RefreshCw,
  AlertTriangle,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const templateId = computed(() => Number(route.params.id))

// Fetch data
const { data: template, isLoading, error, refetch } = useRecurringTemplate(templateId)

// Mutations
const deleteMutation = useDeleteRecurringTemplate()
const pauseMutation = usePauseTemplate()
const resumeMutation = useResumeTemplate()
const generateMutation = useGenerateFromTemplate()

// Modal states
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(templateId.value)
    showDeleteModal.value = false
    toast.success('Template deleted')
    router.push('/accounting/recurring-templates')
  } catch {
    toast.error('Failed to delete template')
  }
}

async function handlePause() {
  try {
    await pauseMutation.mutateAsync(templateId.value)
    toast.success('Template paused')
    refetch()
  } catch {
    toast.error('Failed to pause template')
  }
}

async function handleResume() {
  try {
    await resumeMutation.mutateAsync(templateId.value)
    toast.success('Template resumed')
    refetch()
  } catch {
    toast.error('Failed to resume template')
  }
}

async function handleGenerate() {
  try {
    await generateMutation.mutateAsync(templateId.value)
    toast.success(`${template.value?.type === 'invoice' ? 'Invoice' : 'Bill'} generated`)
    refetch()
  } catch {
    toast.error('Failed to generate document')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <AlertTriangle class="w-12 h-12 mx-auto text-red-400 mb-3" />
      <p class="text-red-500">Failed to load template</p>
      <Button variant="ghost" class="mt-4" @click="router.push('/accounting/recurring-templates')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to List
      </Button>
    </div>

    <!-- Content -->
    <template v-else-if="template">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="router.push('/accounting/recurring-templates')">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ template.name }}</h1>
              <Badge :variant="template.is_active ? 'success' : 'secondary'">
                {{ template.is_active ? 'Active' : 'Paused' }}
              </Badge>
            </div>
            <p class="text-slate-500 dark:text-slate-400">
              {{ template.type === 'invoice' ? 'Recurring Invoice' : 'Recurring Bill' }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <!-- Generate Now -->
          <Button
            variant="secondary"
            :loading="generateMutation.isPending.value"
            @click="handleGenerate"
          >
            <Zap class="w-4 h-4 mr-2" />
            Generate Now
          </Button>

          <!-- Pause/Resume -->
          <Button
            v-if="template.is_active"
            variant="secondary"
            :loading="pauseMutation.isPending.value"
            @click="handlePause"
          >
            <Pause class="w-4 h-4 mr-2" />
            Pause
          </Button>
          <Button
            v-else
            :loading="resumeMutation.isPending.value"
            @click="handleResume"
          >
            <Play class="w-4 h-4 mr-2" />
            Resume
          </Button>

          <!-- Delete -->
          <Button
            variant="destructive"
            @click="showDeleteModal = true"
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Schedule Card -->
          <Card>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Schedule</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Frequency</div>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ getIntervalLabel(template.frequency as RecurringFrequency, template.interval) }}
                </div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Next Run</div>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ template.next_generate_date ? formatDate(template.next_generate_date) : '-' }}
                </div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Start Date</div>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(template.start_date) }}
                </div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">End Date</div>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ template.end_date ? formatDate(template.end_date) : 'No end date' }}
                </div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Occurrences Limit</div>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ template.occurrences_limit ?? 'Unlimited' }}
                </div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Occurrences Count</div>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ template.occurrences_count ?? 0 }} times
                </div>
              </div>
            </div>
          </Card>

          <!-- Document Details Card -->
          <Card>
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Document Details</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Contact</div>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ template.contact?.name ?? '-' }}
                </div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Currency</div>
                <div class="font-medium font-mono text-slate-900 dark:text-slate-100">
                  {{ template.currency }}
                </div>
              </div>
              <div v-if="template.description" class="col-span-2">
                <div class="text-sm text-slate-500 dark:text-slate-400">Description</div>
                <div class="font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line">
                  {{ template.description }}
                </div>
              </div>
            </div>
          </Card>

          <!-- Line Items Card (if available) -->
          <Card v-if="template.items && template.items.length > 0">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Line Items</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-200 dark:border-slate-700">
                    <th class="text-left py-2 font-medium text-slate-500 dark:text-slate-400">Item</th>
                    <th class="text-right py-2 font-medium text-slate-500 dark:text-slate-400">Qty</th>
                    <th class="text-right py-2 font-medium text-slate-500 dark:text-slate-400">Price</th>
                    <th class="text-right py-2 font-medium text-slate-500 dark:text-slate-400">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in (template.items as Array<{ id?: number; description: string; quantity: number; unit_price: number; line_total: number }>)"
                    :key="item.id ?? index"
                    class="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td class="py-2 text-slate-900 dark:text-slate-100">{{ item.description }}</td>
                    <td class="py-2 text-right text-slate-600 dark:text-slate-400">{{ item.quantity }}</td>
                    <td class="py-2 text-right font-mono text-slate-600 dark:text-slate-400">{{ formatCurrency(item.unit_price) }}</td>
                    <td class="py-2 text-right font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(item.line_total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Card -->
          <Card>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">Settings</h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Tax Rate</dt>
                <dd class="font-mono text-slate-900 dark:text-slate-100">{{ template.tax_rate }}%</dd>
              </div>
              <div v-if="template.discount_amount" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Discount</dt>
                <dd class="font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(template.discount_amount) }}</dd>
              </div>
              <div v-if="template.early_discount_percent" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Early Discount</dt>
                <dd class="font-mono text-slate-900 dark:text-slate-100">{{ template.early_discount_percent }}% ({{ template.early_discount_days }} days)</dd>
              </div>
              <hr class="border-slate-200 dark:border-slate-700" />
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Payment Terms</dt>
                <dd class="font-mono text-slate-900 dark:text-slate-100">
                  {{ template.payment_term_days }} days
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Activity Card -->
          <Card>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">Activity</h2>
            <ul class="space-y-3 text-sm">
              <li v-if="template.occurrences_count > 0" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Generated</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ template.occurrences_count }} documents</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Created</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(template.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Template" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this recurring template? This will stop all future automatic generation.
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
