<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContact, useDeleteContact } from '@/api/useContacts'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Modal, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const contactId = computed(() => Number(route.params.id))

const { data: contact, isLoading, error } = useContact(contactId)

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
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      Failed to load contact
    </div>

    <!-- Content -->
    <template v-else-if="contact">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 mb-4">
        <RouterLink to="/contacts" class="hover:text-slate-700">Contacts</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900">{{ contact.name }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900">
                {{ contact.name }}
              </h1>
              <span
                class="px-2.5 py-0.5 rounded text-xs font-medium capitalize"
                :class="{
                  'bg-blue-100 text-blue-700': contact.type === 'customer',
                  'bg-amber-100 text-amber-700': contact.type === 'supplier',
                  'bg-purple-100 text-purple-700': contact.type === 'both',
                }"
              >
                {{ contact.type }}
              </span>
              <span
                class="px-2.5 py-0.5 rounded text-xs font-medium"
                :class="contact.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ contact.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <p class="text-slate-500 font-mono">{{ contact.code }}</p>
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
              <h2 class="font-semibold text-slate-900">Contact Information</h2>
            </template>

            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Email</dt>
                <dd class="font-medium text-slate-900">
                  <a v-if="contact.email" :href="`mailto:${contact.email}`" class="text-orange-600 hover:text-orange-700">
                    {{ contact.email }}
                  </a>
                  <span v-else class="text-slate-400">-</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Phone</dt>
                <dd class="font-medium text-slate-900">
                  <a v-if="contact.phone" :href="`tel:${contact.phone}`" class="text-orange-600 hover:text-orange-700">
                    {{ contact.phone }}
                  </a>
                  <span v-else class="text-slate-400">-</span>
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Address -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Address</h2>
            </template>

            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-slate-500">Street Address</dt>
                <dd class="font-medium text-slate-900">{{ contact.address || '-' }}</dd>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <dt class="text-sm text-slate-500">City</dt>
                  <dd class="font-medium text-slate-900">{{ contact.city || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-slate-500">Province</dt>
                  <dd class="font-medium text-slate-900">{{ contact.province || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-slate-500">Postal Code</dt>
                  <dd class="font-medium text-slate-900">{{ contact.postal_code || '-' }}</dd>
                </div>
              </div>
            </dl>
          </Card>

          <!-- Tax Information -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Tax Information</h2>
            </template>

            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">NPWP</dt>
                <dd class="font-medium text-slate-900 font-mono">{{ contact.npwp || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">NIK</dt>
                <dd class="font-medium text-slate-900 font-mono">{{ contact.nik || '-' }}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Payment Terms -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Payment Terms</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Credit Limit</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(contact.credit_limit) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Payment Terms</dt>
                <dd class="font-medium text-slate-900">{{ contact.payment_term_days }} days</dd>
              </div>
            </dl>
          </Card>

          <!-- Balances -->
          <Card v-if="contact.receivable_balance || contact.payable_balance">
            <template #header>
              <h2 class="font-semibold text-slate-900">Balances</h2>
            </template>

            <dl class="space-y-3">
              <div v-if="contact.receivable_balance" class="flex justify-between">
                <dt class="text-slate-500">Receivable</dt>
                <dd class="font-medium text-green-600">{{ contact.receivable_balance }}</dd>
              </div>
              <div v-if="contact.payable_balance" class="flex justify-between">
                <dt class="text-slate-500">Payable</dt>
                <dd class="font-medium text-red-600">{{ contact.payable_balance }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Quick Links -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Related</h2>
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
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Contact" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete this contact? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="danger"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
