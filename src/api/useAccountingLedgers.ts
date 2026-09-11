import { createCrudHooks } from './factory'

export interface AccountingLedger {
  id: number
  code: string
  name: string
  currency_code?: string | null
  is_default: boolean
  is_active: boolean
  notes?: string | null
  currency?: { id: number; code: string; name: string; symbol: string } | null
}

export interface AccountingLedgerFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateAccountingLedgerData {
  code: string
  name: string
  currency_code?: string | null
  is_default?: boolean
  is_active?: boolean
  notes?: string | null
}

export type UpdateAccountingLedgerData = Partial<CreateAccountingLedgerData>

const hooks = createCrudHooks<
  AccountingLedger,
  AccountingLedgerFilters,
  CreateAccountingLedgerData,
  UpdateAccountingLedgerData
>({
  resourceName: 'accounting-ledgers',
  singularName: 'accountingLedger',
})

export const useAccountingLedgers = hooks.useList
export const useAccountingLedger = hooks.useSingle
export const useCreateAccountingLedger = hooks.useCreate
export const useUpdateAccountingLedger = hooks.useUpdate
export const useDeleteAccountingLedger = hooks.useDelete
