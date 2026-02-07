<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContact, useDeleteContact, useContactCreditStatus } from '@/api/useContacts'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Modal, Badge, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const contactId = computed(() => Number(route.params.id))

const { data: contact, isLoading, error } = useContact(contactId)

// Credit status for customers
const { data: creditStatus, isLoading: loadingCreditStatus } = useContactCreditStatus(contactId)

// Only fetch credit status for customers
const isCustomer = computed(() =>
  contact.value?.type === 'customer' || contact.value?.type === 'both'
)

// Delete handling
const deleteMutation = useDeleteContact()
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(contactId.value)
    showDeleteModal.value = false
    toast.success('Contact deleted')
    router.push('/contacts')
  } catch {
    toast.error('Failed to delete contact')
  }
}

// Helpers
const hasEarlyDiscount = computed(() =>
  contact.value?.early_discount_percent && contact.value?.early_discount_days
)

const hasBankAccount = computed(() =>
  contact.value?.bank_name || contact.value?.bank_account_number
)

const isSubcontractor = computed(() => contact.value?.is_subcontractor)

const subcontractorServicesDisplay = computed(() => {
  const services = contact.value?.subcontractor_services as string[] | null
  if (!services || services.length === 0) return null
  return services.join(', ')
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500 dark:text-slate-400">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      Failed to load contact
    </div>

    <!-- Content -->
    <template v-else-if="contact">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/contacts" class="hover:text-slate-700 dark:hover:text-slate-300">Contacts</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ contact.name }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ contact.name }}
              </h1>
              <span
                class="px-2.5 py-0.5 rounded text-xs font-medium capitalize"
                :class="{
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': contact.type === 'customer',
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': contact.type === 'supplier',
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': contact.type === 'both',
                }"
              >
                {{ contact.type }}
              </span>
              <span
                class="px-2.5 py-0.5 rounded text-xs font-medium"
                :class="contact.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'"
              >
                {{ contact.is_active ? 'Active' : 'Inactive' }}
              </span>
              <Badge v-if="isSubcontractor" variant="secondary">Subcontractor</Badge>
            </div>
            <p class="text-slate-500 dark:text-slate-400 font-mono">{{ contact.code }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <RouterLink :to="`/contacts/${contactId}/edit`">
              <Button variant="secondary" size="sm">Edit</Button>
            </RouterLink>
            <Button
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="showDeleteModal = true"
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Contact Information -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Contact Information</h2>
            </template>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Email</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  <a v-if="contact.email" :href="`mailto:${contact.email}`" class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
                    {{ contact.email }}
                  </a>
                  <span v-else class="text-slate-400 dark:text-slate-500">-</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Phone</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  <a v-if="contact.phone" :href="`tel:${contact.phone}`" class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
                    {{ contact.phone }}
                  </a>
                  <span v-else class="text-slate-400 dark:text-slate-500">-</span>
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Address -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Address</h2>
            </template>

            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Street Address</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ contact.address || '-' }}</dd>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <dt class="text-sm text-slate-500 dark:text-slate-400">City</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ contact.city || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-slate-500 dark:text-slate-400">Province</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ contact.province || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-slate-500 dark:text-slate-400">Postal Code</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ contact.postal_code || '-' }}</dd>
                </div>
              </div>
            </dl>
          </Card>

          <!-- Tax Information -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Tax Information</h2>
            </template>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">NPWP</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100 font-mono">{{ contact.npwp || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">NIK</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100 font-mono">{{ contact.nik || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Bank Account -->
          <Card v-if="hasBankAccount">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Bank Account</h2>
            </template>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Bank Name</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ contact.bank_name || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Account Holder</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ contact.bank_account_name || '-' }}</dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Account Number</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100 font-mono">{{ contact.bank_account_number || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Subcontractor Information -->
          <Card v-if="isSubcontractor">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Subcontractor Details</h2>
            </template>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Hourly Rate</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ contact.hourly_rate ? formatCurrency(contact.hourly_rate) : '-' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Daily Rate</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ contact.daily_rate ? formatCurrency(contact.daily_rate) : '-' }}
                </dd>
              </div>
              <div class="sm:col-span-2" v-if="subcontractorServicesDisplay">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Services</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ subcontractorServicesDisplay }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Notes -->
          <Card v-if="contact.notes">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
            </template>

            <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ contact.notes }}</p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Credit Status Widget (Customers only) -->
          <Card v-if="isCustomer && !loadingCreditStatus && creditStatus">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Credit Status</h2>
            </template>

            <div class="space-y-4">
              <!-- Progress bar showing utilization -->
              <div>
                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="{
                      'bg-red-500': creditStatus.is_exceeded,
                      'bg-amber-500': creditStatus.is_warning && !creditStatus.is_exceeded,
                      'bg-primary': !creditStatus.is_warning && !creditStatus.is_exceeded,
                    }"
                    :style="{ width: `${Math.min(creditStatus.credit_utilization_percent, 100)}%` }"
                  />
                </div>
                <div class="flex justify-between text-sm mt-2">
                  <span class="text-slate-500 dark:text-slate-400">{{ creditStatus.credit_utilization_percent.toFixed(1) }}% used</span>
                  <span class="font-medium text-green-600 dark:text-green-400">
                    Available: {{ formatCurrency(creditStatus.available_credit) }}
                  </span>
                </div>
              </div>

              <!-- Warning/Exceeded badges -->
              <div v-if="creditStatus.is_exceeded" class="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 rounded-md px-3 py-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Credit limit exceeded
              </div>
              <div v-else-if="creditStatus.is_warning" class="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-3 py-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Approaching credit limit
              </div>

              <!-- Details -->
              <dl class="space-y-2 text-sm pt-2 border-t border-border">
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Credit Limit</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(creditStatus.credit_limit) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Outstanding</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(creditStatus.receivable_balance) }}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <!-- Payment Terms -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Payment Terms</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Credit Limit</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(contact.credit_limit) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Payment Terms</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ contact.payment_term_days }} days</dd>
              </div>
              <div v-if="contact.currency && contact.currency !== 'IDR'" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Currency</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ contact.currency }}</dd>
              </div>
              <template v-if="hasEarlyDiscount">
                <div class="pt-2 mt-2 border-t border-border">
                  <dt class="text-slate-500 dark:text-slate-400 mb-1">Early Payment Discount</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">
                    {{ contact.early_discount_percent }}% if paid within {{ contact.early_discount_days }} days
                  </dd>
                </div>
              </template>
            </dl>
          </Card>

          <!-- Balances -->
          <Card v-if="contact.receivable_balance || contact.payable_balance">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Balances</h2>
            </template>

            <dl class="space-y-3">
              <div v-if="contact.receivable_balance" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Receivable</dt>
                <dd class="font-medium text-green-600 dark:text-green-400">{{ contact.receivable_balance }}</dd>
              </div>
              <div v-if="contact.payable_balance" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Payable</dt>
                <dd class="font-medium text-red-600 dark:text-red-400">{{ contact.payable_balance }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Quick Links -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Related</h2>
            </template>

            <div class="space-y-2">
              <RouterLink
                v-if="contact.type === 'customer' || contact.type === 'both'"
                :to="`/quotations?contact_id=${contact.id}`"
                class="block"
              >
                <Button variant="ghost" class="w-full justify-start">
                  View Quotations
                </Button>
              </RouterLink>
              <RouterLink
                v-if="contact.type === 'customer' || contact.type === 'both'"
                :to="`/invoices?contact_id=${contact.id}`"
                class="block"
              >
                <Button variant="ghost" class="w-full justify-start">
                  View Invoices
                </Button>
              </RouterLink>
              <RouterLink
                v-if="contact.type === 'supplier' || contact.type === 'both'"
                :to="`/purchasing/purchase-orders?contact_id=${contact.id}`"
                class="block"
              >
                <Button variant="ghost" class="w-full justify-start">
                  View Purchase Orders
                </Button>
              </RouterLink>
              <RouterLink
                v-if="contact.type === 'supplier' || contact.type === 'both'"
                :to="`/bills?contact_id=${contact.id}`"
                class="block"
              >
                <Button variant="ghost" class="w-full justify-start">
                  View Bills
                </Button>
              </RouterLink>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Contact" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this contact? This action cannot be undone.
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
  </div>
</template>
