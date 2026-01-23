import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref, type ComputedRef } from 'vue'
import { createCrudHooks } from './factory'
import { api, type PaginatedResponse } from './client'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type Account = components['schemas']['AccountResource']

export interface AccountFilters {
  page?: number
  per_page?: number
  search?: string
  type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  is_active?: boolean
  parent_id?: string | null
}

export type CreateAccountData = paths['/accounts']['post']['requestBody']['content']['application/json']

export interface AccountBalance {
  account_id: string
  account_code: string
  account_name: string
  debit_total: string
  credit_total: string
  balance: string
  as_of_date: string
}

export interface LedgerEntry {
  id: string
  date: string
  entry_number: string
  description: string
  reference: string | null
  debit: string
  credit: string
  running_balance: string
  journal_entry_id: string
}

export interface LedgerFilters {
  start_date?: string
  end_date?: string
  page?: number
  per_page?: number
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Account, AccountFilters, CreateAccountData>({
  resourceName: 'accounts',
  lookupParams: { is_active: true, per_page: 500 },
})

export const useAccounts = hooks.useList
export const useAccount = hooks.useSingle
export const useCreateAccount = hooks.useCreate
export const useUpdateAccount = hooks.useUpdate
export const useDeleteAccount = hooks.useDelete

/**
 * Fetch accounts for dropdown/select (lightweight, includes all)
 */
export function useAccountsLookup(type?: Account['type']) {
  return hooks.useLookup({ type })
}

// ============================================
// Additional Hooks
// ============================================

/**
 * Fetch accounts as a flat list (for tree building)
 * Returns all accounts without pagination
 */
export function useAccountsTree() {
  return useQuery({
    queryKey: ['accounts', 'tree'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Account>>('/accounts', {
        params: { per_page: 1000, is_active: true },
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch account balance
 */
export function useAccountBalance(
  accountId: Ref<number | string> | ComputedRef<number | string>,
  asOfDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: computed(() => ['account', accountId.value, 'balance', asOfDate?.value]),
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (asOfDate?.value) {
        params.as_of_date = asOfDate.value
      }
      const response = await api.get<{ data: AccountBalance }>(
        `/accounts/${accountId.value}/balance`,
        { params }
      )
      return response.data.data
    },
    enabled: computed(() => !!accountId.value),
  })
}

/**
 * Fetch account ledger entries
 */
export function useAccountLedger(
  accountId: Ref<number | string> | ComputedRef<number | string>,
  filters: Ref<LedgerFilters>
) {
  return useQuery({
    queryKey: computed(() => ['account', accountId.value, 'ledger', filters.value]),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<LedgerEntry>>(
        `/accounts/${accountId.value}/ledger`,
        { params: filters.value }
      )
      return response.data
    },
    enabled: computed(() => !!accountId.value),
  })
}

// ============================================
// Helper Functions
// ============================================

/**
 * Build a tree structure from flat accounts list
 */
export function buildAccountTree(accounts: Account[]): Account[] {
  const accountMap = new Map<string, Account & { children: Account[] }>()
  const roots: (Account & { children: Account[] })[] = []

  // First pass: create map and initialize children arrays
  accounts.forEach((account) => {
    accountMap.set(String(account.id), { ...account, children: [] })
  })

  // Second pass: build tree structure
  accounts.forEach((account) => {
    const node = accountMap.get(String(account.id))
    if (!node) return

    const parentId = account.parent_id ? String(account.parent_id) : null

    if (parentId && accountMap.has(parentId)) {
      accountMap.get(parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })

  // Sort by code at each level
  const sortByCode = (items: Account[]) => {
    items.sort((a, b) => a.code.localeCompare(b.code))
    items.forEach((item) => {
      if ((item as Account & { children: Account[] }).children?.length) {
        sortByCode((item as Account & { children: Account[] }).children)
      }
    })
  }
  sortByCode(roots)

  return roots
}

/**
 * Get account type label
 */
export function getAccountTypeLabel(type: Account['type']): string {
  const labels: Record<string, string> = {
    asset: 'Aset',
    liability: 'Kewajiban',
    equity: 'Ekuitas',
    revenue: 'Pendapatan',
    expense: 'Beban',
  }
  return labels[type] || type
}

/**
 * Get account type color class
 */
export function getAccountTypeColor(type: Account['type']): string {
  const colors: Record<string, string> = {
    asset: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    liability: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    equity: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    revenue: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    expense: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  }
  return colors[type] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
}
