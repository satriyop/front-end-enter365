<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useJournalEntry,
  useDeleteJournalEntry,
  usePostJournalEntry,
  useReverseJournalEntry,
  getJournalEntryStatus,
} from '@/api/useJournalEntries'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Modal, Input, useToast } from '@/components/ui'
import { ArrowLeft, Trash2, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const entryId = computed(() => String(route.params.id))

// Fetch journal entry
const { data: entry, isLoading, error, refetch } = useJournalEntry(entryId)

// Mutations
const deleteMutation = useDeleteJournalEntry()
const postMutation = usePostJournalEntry()
const reverseMutation = useReverseJournalEntry()

// Modal states
const showDeleteModal = ref(false)
const showPostModal = ref(false)
const showReverseModal = ref(false)

// Reverse form state
const reversalDate = ref(new Date().toISOString().split('T')[0])
const reversalDescription = ref('')

// Status info
const status = computed(() => entry.value ? getJournalEntryStatus(entry.value) : null)

// Check if entry can be modified
const isPosted = computed(() => !!entry.value?.is_posted)
const isReversed = computed(() => !!entry.value?.is_reversed)

const canDelete = computed(() => entry.value && !isPosted.value && !isReversed.value)
const canPost = computed(() => entry.value && !isPosted.value && !isReversed.value && entry.value.is_balanced)
const canReverse = computed(() => entry.value && isPosted.value && !isReversed.value)

// Delete handler
async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(entryId.value)
    showDeleteModal.value = false
    toast.success('Journal entry deleted')
    router.push('/accounting/journal-entries')
  } catch {
    toast.error('Failed to delete journal entry')
  }
}

// Post handler
async function handlePost() {
  try {
    await postMutation.mutateAsync(entryId.value)
    showPostModal.value = false
    toast.success('Journal entry posted')
    refetch()
  } catch {
    toast.error('Failed to post journal entry')
  }
}

// Reverse handler
async function handleReverse() {
  try {
    await reverseMutation.mutateAsync({
      id: entryId.value,
      reversal_date: reversalDate.value,
      description: reversalDescription.value || undefined,
    })
    showReverseModal.value = false
    toast.success('Journal entry reversed')
    refetch()
  } catch {
    toast.error('Failed to reverse journal entry')
  }
}

// Navigate to related entry
function viewRelatedEntry(id: string) {
  router.push(`/accounting/journal-entries/${id}`)
}

// Navigate to account
function viewAccount(accountId: string) {
  router.push(`/accounting/accounts/${accountId}`)
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
      Failed to load journal entry
    </div>

    <!-- Content -->
    <template v-else-if="entry">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/accounting/journal-entries" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Journal Entries
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ entry.entry_number }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-mono">
                {{ entry.entry_number }}
              </h1>
              <span
                v-if="status"
                class="px-2.5 py-0.5 rounded text-xs font-medium"
                :class="status.color"
              >
                {{ status.label }}
              </span>
            </div>
            <p class="text-slate-600 dark:text-slate-400">{{ entry.description }}</p>
            <div class="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span>{{ formatDate(entry.entry_date) }}</span>
              <span v-if="entry.reference">Ref: {{ entry.reference }}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- Post Button -->
            <Button
              v-if="canPost"
              variant="default"
              size="sm"
              @click="showPostModal = true"
            >
              <CheckCircle class="w-4 h-4 mr-2" />
              Post Entry
            </Button>

            <!-- Reverse Button -->
            <Button
              v-if="canReverse"
              variant="secondary"
              size="sm"
              @click="showReverseModal = true"
            >
              <RotateCcw class="w-4 h-4 mr-2" />
              Reverse
            </Button>

            <!-- Delete Button -->
            <Button
              v-if="canDelete"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="showDeleteModal = true"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <!-- Warning for unbalanced entry -->
        <div
          v-if="!entry.is_balanced"
          class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3"
        >
          <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-amber-700 dark:text-amber-400">
            <strong>Entry is not balanced.</strong>
            Total debit ({{ formatCurrency(entry.total_debit) }}) does not equal
            total credit ({{ formatCurrency(entry.total_credit) }}).
          </div>
        </div>

        <!-- Reversal info -->
        <div
          v-if="entry.reversed_by"
          class="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            This entry was reversed by
            <button
              class="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-mono"
              @click="viewRelatedEntry(String(entry.reversed_by.id))"
            >
              {{ entry.reversed_by.entry_number }}
            </button>
          </p>
        </div>

        <!-- Reversal of info -->
        <div
          v-if="entry.reversal_of"
          class="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <p class="text-sm text-slate-600 dark:text-slate-400">
            This is a reversal of
            <button
              class="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-mono"
              @click="viewRelatedEntry(String(entry.reversal_of.id))"
            >
              {{ entry.reversal_of.entry_number }}
            </button>
          </p>
        </div>
      </Card>

      <!-- Entry Lines -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Entry Lines</h2>
            <div class="flex items-center gap-4 text-sm">
              <span class="text-slate-500 dark:text-slate-400">
                Debit: <span class="font-mono font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(entry.total_debit) }}</span>
              </span>
              <span class="text-slate-500 dark:text-slate-400">
                Credit: <span class="font-mono font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(entry.total_credit) }}</span>
              </span>
            </div>
          </div>
        </template>

        <div class="overflow-x-auto -mx-6 -mb-6">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Account</th>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Description</th>
                <th class="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Debit</th>
                <th class="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Credit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="line in entry.lines"
                :key="line.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <td class="px-4 py-3">
                  <button
                    v-if="line.account"
                    class="text-left hover:text-orange-600 dark:hover:text-orange-400"
                    @click="viewAccount(String(line.account.id))"
                  >
                    <span class="font-mono text-slate-500 dark:text-slate-400">{{ line.account.code }}</span>
                    <span class="ml-2 text-slate-900 dark:text-slate-100">{{ line.account.name }}</span>
                  </button>
                </td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {{ line.description || '-' }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ parseFloat(line.debit) > 0 ? formatCurrency(parseFloat(line.debit)) : '-' }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ parseFloat(line.credit) > 0 ? formatCurrency(parseFloat(line.credit)) : '-' }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-50 dark:bg-slate-800/50 font-medium">
              <tr>
                <td class="px-4 py-3 text-slate-900 dark:text-slate-100" colspan="2">Total</td>
                <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(entry.total_debit) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(entry.total_credit) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <!-- Additional Info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <!-- Fiscal Period -->
        <Card v-if="entry.fiscal_period">
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Fiscal Period</h2>
          </template>
          <div class="text-sm">
            <p class="font-medium text-slate-900 dark:text-slate-100">{{ entry.fiscal_period.name }}</p>
            <p class="text-slate-500 dark:text-slate-400">
              {{ formatDate(entry.fiscal_period.start_date) }} -
              {{ formatDate(entry.fiscal_period.end_date) }}
            </p>
          </div>
        </Card>

        <!-- Metadata -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Details</h2>
          </template>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Created</dt>
              <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(entry.created_at) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Updated</dt>
              <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(entry.updated_at) }}</dd>
            </div>
            <div v-if="entry.source_type" class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Source</dt>
              <dd class="text-slate-900 dark:text-slate-100">{{ entry.source_type }}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Journal Entry" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete entry <strong class="font-mono">{{ entry?.entry_number }}</strong>?
        This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>
    </Modal>

    <!-- Post Modal -->
    <Modal :open="showPostModal" title="Post Journal Entry" size="sm" @update:open="showPostModal = $event">
      <div class="space-y-4">
        <p class="text-slate-600 dark:text-slate-400">
          Are you sure you want to post entry <strong class="font-mono">{{ entry?.entry_number }}</strong>?
        </p>
        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p class="text-sm text-amber-700 dark:text-amber-400">
            <strong>Warning:</strong> Posted entries cannot be edited or deleted.
            They can only be reversed with a new entry.
          </p>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showPostModal = false">Cancel</Button>
        <Button
          :loading="postMutation.isPending.value"
          @click="handlePost"
        >
          <CheckCircle class="w-4 h-4 mr-2" />
          Post Entry
        </Button>
      </template>
    </Modal>

    <!-- Reverse Modal -->
    <Modal :open="showReverseModal" title="Reverse Journal Entry" size="md" @update:open="showReverseModal = $event">
      <div class="space-y-4">
        <p class="text-slate-600 dark:text-slate-400">
          This will create a new entry that reverses <strong class="font-mono">{{ entry?.entry_number }}</strong>.
        </p>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Reversal Date
          </label>
          <Input v-model="reversalDate" type="date" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description (optional)
          </label>
          <Input
            v-model="reversalDescription"
            :placeholder="`Reversal of ${entry?.entry_number}`"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showReverseModal = false">Cancel</Button>
        <Button
          :loading="reverseMutation.isPending.value"
          @click="handleReverse"
        >
          <RotateCcw class="w-4 h-4 mr-2" />
          Create Reversal
        </Button>
      </template>
    </Modal>
  </div>
</template>
