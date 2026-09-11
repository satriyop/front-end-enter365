import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'

export type AccountingTransferStatus = 'draft' | 'posted' | 'cancelled'

export interface AccountingTransferAccount {
  id: number
  code: string
  name: string
}

export interface AccountingTransferJournal {
  id: number
  name: string
  type: string
}

export interface AccountingTransfer {
  id: number
  transfer_number: string
  transfer_date: string
  from_journal_id: number
  to_journal_id: number
  from_account_id: number
  to_account_id: number
  amount: number
  status: AccountingTransferStatus
  memo?: string | null
  journal_entry_id?: number | null
  from_journal?: AccountingTransferJournal | null
  to_journal?: AccountingTransferJournal | null
  from_account?: AccountingTransferAccount | null
  to_account?: AccountingTransferAccount | null
  journal_entry?: { id: number; entry_number: string; is_posted: boolean } | null
}

export interface AccountingTransferFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
}

export interface CreateAccountingTransferData {
  transfer_date: string
  from_journal_id: number
  to_journal_id: number
  from_account_id?: number | null
  to_account_id?: number | null
  amount: number
  memo?: string | null
}

export type UpdateAccountingTransferData = Partial<CreateAccountingTransferData>

const hooks = createCrudHooks<
  AccountingTransfer,
  AccountingTransferFilters,
  CreateAccountingTransferData,
  UpdateAccountingTransferData
>({
  resourceName: 'accounting-transfers',
  singularName: 'accountingTransfer',
})

export const useAccountingTransfers = hooks.useList
export const useAccountingTransfer = hooks.useSingle
export const useCreateAccountingTransfer = hooks.useCreate
export const useUpdateAccountingTransfer = hooks.useUpdate
export const useDeleteAccountingTransfer = hooks.useDelete

export function usePostAccountingTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: AccountingTransfer }>('/accounting-transfers/' + id + '/post')
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-transfers'] })
    },
  })
}

export function useCancelAccountingTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: AccountingTransfer }>(
        '/accounting-transfers/' + payload.id + '/cancel',
        { reason: payload.reason },
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-transfers'] })
    },
  })
}
