<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContacts, useDeleteContact, type ContactFilters } from '@/api/useContacts'
import { Button, Input, Select, Pagination, EmptyState, Modal, useToast } from '@/components/ui'

const toast = useToast()

// Filters state
const filters = ref<ContactFilters>({
  page: 1,
  per_page: 10,
  type: undefined,
  search: '',
  is_active: undefined,
})

// Fetch contacts
const { data, isLoading, error } = useContacts(filters)

const contacts = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

// Type options
const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'customer', label: 'Customers' },
  { value: 'supplier', label: 'Suppliers' },
  { value: 'both', label: 'Both' },
]

// Status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

function handleStatusChange(value: string | number | null) {
  if (value === 'true') {
    filters.value.is_active = true
  } else if (value === 'false') {
    filters.value.is_active = false
  } else {
    filters.value.is_active = undefined
  }
  filters.value.page = 1
}

// Delete handling
const deleteMutation = useDeleteContact()
const showDeleteModal = ref(false)
const contactToDelete = ref<number | null>(null)

function confirmDelete(id: number) {
  contactToDelete.value = id
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!contactToDelete.value) return

  try {
    await deleteMutation.mutateAsync(contactToDelete.value)
    showDeleteModal.value = false
    contactToDelete.value = null
    toast.success('Contact deleted')
  } catch {
    toast.error('Failed to delete contact')
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Contacts</h1>
        <p class="text-slate-500">Manage customers and suppliers</p>
      </div>
      <RouterLink to="/contacts/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Contact
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by name, email, phone..."
            @update:model-value="handleSearch"
          />
        </div>

        <!-- Type Filter -->
        <div class="w-40">
          <Select
            v-model="filters.type"
            :options="typeOptions"
            placeholder="All Types"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <Select
            :model-value="filters.is_active === true ? 'true' : filters.is_active === false ? 'false' : ''"
            :options="statusOptions"
            placeholder="All Status"
            @update:model-value="handleStatusChange"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p class="text-red-500">Failed to load contacts</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="contacts.length === 0" class="bg-white rounded-xl border border-slate-200">
      <EmptyState
        title="No contacts found"
        description="Add customers and suppliers to manage your business relationships"
        action-label="New Contact"
        @action="$router.push('/contacts/new')"
      />
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Code
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Type
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Contact Info
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr
            v-for="contact in contacts"
            :key="contact.id"
            class="hover:bg-slate-50"
          >
            <td class="px-6 py-4">
              <span class="font-mono text-sm text-slate-600">{{ contact.code }}</span>
            </td>
            <td class="px-6 py-4">
              <RouterLink
                :to="`/contacts/${contact.id}`"
                class="text-orange-600 hover:text-orange-700 font-medium"
              >
                {{ contact.name }}
              </RouterLink>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize"
                :class="{
                  'bg-blue-100 text-blue-700': contact.type === 'customer',
                  'bg-amber-100 text-amber-700': contact.type === 'supplier',
                  'bg-purple-100 text-purple-700': contact.type === 'both',
                }"
              >
                {{ contact.type }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div v-if="contact.email" class="text-sm text-slate-900">{{ contact.email }}</div>
              <div v-if="contact.phone" class="text-sm text-slate-500">{{ contact.phone }}</div>
              <div v-if="!contact.email && !contact.phone" class="text-sm text-slate-400">-</div>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                :class="contact.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ contact.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <RouterLink :to="`/contacts/${contact.id}/edit`">
                  <Button variant="ghost" size="xs">Edit</Button>
                </RouterLink>
                <Button
                  variant="ghost"
                  size="xs"
                  class="text-red-500 hover:text-red-600"
                  @click="confirmDelete(contact.id)"
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal :open="showDeleteModal" title="Delete Contact" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
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
