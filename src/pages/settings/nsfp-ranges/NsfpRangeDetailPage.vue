<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useNsfpRange,
  useDeactivateNsfpRange,
} from '@/api/useNsfpRanges'
import { formatDate } from '@/utils/format'
import { Button, Card, Badge, Modal, useToast } from '@/components/ui'
import {
  ArrowLeft,
  Hash,
  Pencil,
  XCircle,
  AlertTriangle,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const rangeId = computed(() => Number(route.params.id))

// Fetch NSFP range
const { data: range, isLoading, error, refetch } = useNsfpRange(rangeId)

// Deactivate mutation
const deactivateMutation = useDeactivateNsfpRange()
const showDeactivateModal = ref(false)

// Permissions
const canEdit = computed(() => range.value && range.value.is_active && !range.value.is_exhausted)
const canDeactivate = computed(() => range.value && range.value.is_active)

// Status badge
function getStatusVariant(r: typeof range.value): 'success' | 'default' | 'destructive' | 'warning' {
  if (!r) return 'default'
  if (r.is_exhausted) return 'destructive'
  if (r.is_low_stock) return 'warning'
  if (!r.is_active) return 'default'
  return 'success'
}

function getStatusLabel(r: typeof range.value): string {
  if (!r) return ''
  if (r.is_exhausted) return 'Exhausted'
  if (r.is_low_stock) return 'Low Stock'
  if (!r.is_active) return 'Inactive'
  return 'Active'
}

// Utilization bar color
const utilizationBarColor = computed(() => {
  const pct = range.value?.utilization_percent ?? 0
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 75) return 'bg-amber-500'
  return 'bg-green-500'
})

// Handlers
async function handleDeactivate() {
  try {
    await deactivateMutation.mutateAsync(rangeId.value)
    showDeactivateModal.value = false
    toast.success('NSFP range deactivated')
    refetch()
  } catch {
    toast.error('Failed to deactivate range')
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500 dark:text-slate-400">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      Failed to load NSFP range
    </div>

    <!-- Content -->
    <template v-else-if="range">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/settings/nsfp-ranges" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          NSFP Ranges
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">
          {{ range.formatted_range_start }} — {{ range.formatted_range_end }}
        </span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <Hash class="w-6 h-6 text-slate-400" />
              <h1 class="text-2xl font-semibold font-mono text-slate-900 dark:text-slate-100">
                {{ range.formatted_range_start }} — {{ range.formatted_range_end }}
              </h1>
              <Badge :variant="getStatusVariant(range)">
                {{ getStatusLabel(range) }}
              </Badge>
            </div>
            <p v-if="range.description" class="text-slate-600 dark:text-slate-400">
              {{ range.description }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <Button
              v-if="canEdit"
              variant="secondary"
              size="sm"
              @click="router.push(`/settings/nsfp-ranges/${rangeId}/edit`)"
            >
              <Pencil class="w-4 h-4 mr-2" />
              Edit
            </Button>

            <Button
              v-if="canDeactivate"
              variant="secondary"
              size="sm"
              class="text-destructive hover:text-destructive/80"
              @click="showDeactivateModal = true"
            >
              <XCircle class="w-4 h-4 mr-2" />
              Deactivate
            </Button>
          </div>
        </div>
      </Card>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Details Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Range Details</h2>
            </template>

            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-muted-foreground">Transaction Code</dt>
                <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {{ range.transaction_code }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Branch Code</dt>
                <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {{ range.branch_code }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Year Code</dt>
                <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">
                  20{{ range.year_code }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Range Start</dt>
                <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {{ range.formatted_range_start }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Range End</dt>
                <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {{ range.formatted_range_end }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Next Number</dt>
                <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {{ range.formatted_next_number ?? '-' }}
                </dd>
              </div>
              <div v-if="range.description" class="col-span-2">
                <dt class="text-muted-foreground">Description</dt>
                <dd class="text-slate-900 dark:text-slate-100">
                  {{ range.description }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Created</dt>
                <dd class="text-slate-900 dark:text-slate-100">
                  {{ formatDate(range.created_at) }}
                </dd>
              </div>
              <div v-if="range.creator">
                <dt class="text-muted-foreground">Created By</dt>
                <dd class="text-slate-900 dark:text-slate-100">
                  {{ range.creator.name }}
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Linked Invoices Info -->
          <Card v-if="range.invoice_count !== undefined">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Linked Invoices</h2>
            </template>
            <p class="text-sm text-slate-600 dark:text-slate-400">
              This range has been used for <strong class="text-slate-900 dark:text-slate-100">{{ range.invoice_count }}</strong> tax invoices.
            </p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Utilization Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Utilization</h2>
            </template>

            <div class="space-y-4">
              <dl class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <dt class="text-muted-foreground">Capacity</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                    {{ range.capacity.toLocaleString() }}
                  </dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-muted-foreground">Used</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                    {{ range.used_count.toLocaleString() }}
                  </dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-muted-foreground">Remaining</dt>
                  <dd class="font-medium tabular-nums" :class="range.remaining <= 0 ? 'text-destructive' : 'text-slate-900 dark:text-slate-100'">
                    {{ range.remaining.toLocaleString() }}
                  </dd>
                </div>
              </dl>

              <!-- Progress Bar -->
              <div>
                <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                  <div
                    class="h-2.5 rounded-full transition-all"
                    :class="utilizationBarColor"
                    :style="{ width: `${Math.min(range.utilization_percent, 100)}%` }"
                  />
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ range.utilization_percent }}% utilized
                </p>
              </div>

              <!-- Warnings -->
              <div
                v-if="range.is_exhausted"
                class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div class="flex items-start gap-2">
                  <AlertTriangle class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-red-700 dark:text-red-400">
                    This range is exhausted. No more numbers available.
                  </p>
                </div>
              </div>
              <div
                v-else-if="range.is_low_stock"
                class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
              >
                <div class="flex items-start gap-2">
                  <AlertTriangle class="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-amber-700 dark:text-amber-400">
                    Running low — consider requesting a new range allocation.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Deactivate Modal -->
    <Modal :open="showDeactivateModal" title="Deactivate NSFP Range" size="sm" @update:open="showDeactivateModal = $event">
      <div class="space-y-4">
        <p class="text-slate-600 dark:text-slate-400">
          Are you sure you want to deactivate this range?
        </p>
        <div v-if="range" class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p class="font-mono text-sm text-slate-900 dark:text-slate-100">
            {{ range.formatted_range_start }} — {{ range.formatted_range_end }}
          </p>
        </div>
        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p class="text-sm text-amber-700 dark:text-amber-400">
            Deactivating will prevent this range from being used for new tax invoices.
            Existing invoices will not be affected.
          </p>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showDeactivateModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deactivateMutation.isPending.value" @click="handleDeactivate">
          <XCircle class="w-4 h-4 mr-2" />
          Deactivate
        </Button>
      </template>
    </Modal>
  </div>
</template>
