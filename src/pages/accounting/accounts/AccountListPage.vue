<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useAccountsTree,
  useDeleteAccount,
  buildAccountTree,
  type Account,
} from '@/api/useAccounts'
import { Button, Input, Select, Card, Modal, useToast } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'
import AccountTreeNode from './AccountTreeNode.vue'

const router = useRouter()
const toast = useToast()

// Fetch all accounts for tree
const { data: accountsData, isLoading, error, refetch } = useAccountsTree()

// Build tree structure
const accountTree = computed(() => {
  if (!accountsData.value) return []
  return buildAccountTree(accountsData.value)
})

// Filter state
const searchQuery = ref('')
const typeFilter = ref<string>('')

// Type options for filter
const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'asset', label: 'Aset' },
  { value: 'liability', label: 'Kewajiban' },
  { value: 'equity', label: 'Ekuitas' },
  { value: 'revenue', label: 'Pendapatan' },
  { value: 'expense', label: 'Beban' },
]

// Expanded nodes tracking
const expandedNodes = ref<Set<string>>(new Set())

function toggleNode(id: string) {
  if (expandedNodes.value.has(id)) {
    expandedNodes.value.delete(id)
  } else {
    expandedNodes.value.add(id)
  }
}

function expandAll() {
  accountsData.value?.forEach((account) => {
    if (account.children?.length || !account.parent_id) {
      expandedNodes.value.add(String(account.id))
    }
  })
}

function collapseAll() {
  expandedNodes.value.clear()
}

// Filter accounts
const filteredTree = computed(() => {
  if (!searchQuery.value && !typeFilter.value) {
    return accountTree.value
  }

  const search = searchQuery.value.toLowerCase()
  const type = typeFilter.value

  function filterNode(node: Account & { children?: Account[] }): (Account & { children?: Account[] }) | null {
    // Check if this node matches
    const matchesSearch = !search ||
      node.name.toLowerCase().includes(search) ||
      node.code.toLowerCase().includes(search)
    const matchesType = !type || node.type === type

    // Filter children recursively
    const filteredChildren = (node.children || [])
      .map(child => filterNode(child as Account & { children?: Account[] }))
      .filter((child): child is Account & { children?: Account[] } => child !== null)

    // Include node if it matches OR has matching children
    if ((matchesSearch && matchesType) || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      }
    }

    return null
  }

  return accountTree.value
    .map(node => filterNode(node as Account & { children?: Account[] }))
    .filter((node): node is Account & { children?: Account[] } => node !== null)
})

// Auto-expand when searching
watch(searchQuery, (val) => {
  if (val) {
    expandAll()
  }
})

// Delete handling
const deleteMutation = useDeleteAccount()
const showDeleteModal = ref(false)
const accountToDelete = ref<Account | null>(null)

function confirmDelete(account: Account) {
  accountToDelete.value = account
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!accountToDelete.value) return

  try {
    await deleteMutation.mutateAsync(accountToDelete.value.id)
    showDeleteModal.value = false
    accountToDelete.value = null
    toast.success('Account deleted')
    refetch()
  } catch {
    toast.error('Failed to delete account')
  }
}

// Navigate to detail
function goToAccount(account: Account) {
  router.push(`/accounting/accounts/${account.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Chart of Accounts</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage your account structure</p>
      </div>
      <RouterLink to="/accounting/accounts/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Account
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
            v-model="searchQuery"
            placeholder="Search by name or code..."
            class="pl-9"
          />
        </div>

        <!-- Type Filter -->
        <div class="w-40">
          <Select
            v-model="typeFilter"
            :options="typeOptions"
            placeholder="All Types"
          />
        </div>

        <!-- Expand/Collapse buttons -->
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" @click="expandAll">
            Expand All
          </Button>
          <Button variant="ghost" size="sm" @click="collapseAll">
            Collapse All
          </Button>
        </div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-red-500">Failed to load accounts</p>
      <Button variant="ghost" class="mt-2" @click="() => refetch()">
        Try Again
      </Button>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading accounts...</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="filteredTree.length === 0" class="text-center py-12">
      <div class="text-slate-400 dark:text-slate-500 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">
        {{ searchQuery || typeFilter ? 'No accounts found' : 'No accounts yet' }}
      </h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        {{ searchQuery || typeFilter ? 'Try adjusting your filters' : 'Create your first account to get started' }}
      </p>
      <RouterLink v-if="!searchQuery && !typeFilter" to="/accounting/accounts/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Account
        </Button>
      </RouterLink>
    </Card>

    <!-- Account Tree -->
    <Card v-else :padding="false">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div class="grid grid-cols-12 gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
          <div class="col-span-5">Account</div>
          <div class="col-span-2">Type</div>
          <div class="col-span-2 text-right">Balance</div>
          <div class="col-span-1 text-center">Status</div>
          <div class="col-span-2 text-right">Actions</div>
        </div>
      </div>

      <!-- Tree Content -->
      <div class="divide-y divide-slate-100 dark:divide-slate-800">
        <template v-for="account in filteredTree" :key="account.id">
          <AccountTreeNode
            :account="account"
            :level="0"
            :expanded-nodes="expandedNodes"
            @toggle="toggleNode"
            @click="goToAccount"
            @edit="(a) => router.push(`/accounting/accounts/${a.id}/edit`)"
            @delete="confirmDelete"
          />
        </template>
      </div>
    </Card>

    <!-- Delete Confirmation Modal -->
    <Modal :open="showDeleteModal" title="Delete Account" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete <strong>{{ accountToDelete?.name }}</strong>?
        This action cannot be undone.
      </p>
      <p v-if="accountToDelete?.children?.length" class="mt-2 text-amber-600 dark:text-amber-400 text-sm">
        Warning: This account has sub-accounts that will also be affected.
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