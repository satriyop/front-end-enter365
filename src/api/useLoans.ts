import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'

export type LoanStatus = 'draft' | 'running' | 'closed'
export type LoanLineStatus = 'draft' | 'posted'

export interface LoanLine {
  id: number
  loan_id: number
  sequence: number
  due_date: string
  principal_amount: number
  interest_amount: number
  payment_amount: number
  remaining_principal: number
  status: LoanLineStatus
  journal_entry_id?: number | null
  posted_at?: string | null
}

export interface Loan {
  id: number
  code: string
  name: string
  contact_id?: number | null
  principal: number
  annual_interest_rate: number
  duration_months: number
  start_date: string
  liability_account_id: number
  interest_account_id: number
  bank_account_id: number
  journal_id?: number | null
  status: LoanStatus
  remaining_principal: number
  disbursement_journal_entry_id?: number | null
  notes?: string | null
  contact?: { id: number; code: string; name: string } | null
  lines?: LoanLine[]
}

export interface LoanFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
}

export interface CreateLoanData {
  code: string
  name: string
  contact_id?: number | null
  principal: number
  annual_interest_rate?: number
  duration_months: number
  start_date: string
  liability_account_id: number
  interest_account_id: number
  bank_account_id: number
  journal_id?: number | null
  notes?: string | null
}

export type UpdateLoanData = Partial<CreateLoanData>

export interface LoanAnalysisRow {
  status: LoanStatus
  loan_count: number
  total_principal: number
  remaining_principal: number
}

export interface LoanAnalysisUpcoming {
  id: number
  loan_id: number
  loan_code: string
  loan_name: string
  sequence: number
  due_date: string
  principal_amount: number
  interest_amount: number
  payment_amount: number
  remaining_principal: number
  status: LoanLineStatus
}

export interface LoanAnalysis {
  loan_count: number
  running_count: number
  total_principal: number
  remaining_principal: number
  interest_posted: number
  interest_remaining: number
  by_status: LoanAnalysisRow[]
  upcoming: LoanAnalysisUpcoming[]
}

const hooks = createCrudHooks<Loan, LoanFilters, CreateLoanData, UpdateLoanData>({
  resourceName: 'loans',
  singularName: 'loan',
})

export const useLoans = hooks.useList
export const useLoan = hooks.useSingle
export const useCreateLoan = hooks.useCreate
export const useUpdateLoan = hooks.useUpdate
export const useDeleteLoan = hooks.useDelete

export function useConfirmLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Loan }>(`/loans/${id}/confirm`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loans-analysis'] })
    },
  })
}

export function usePostLoanInstallment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Loan }>(`/loans/${id}/post-installment`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['loans-analysis'] })
    },
  })
}

export function useLoansAnalysis() {
  return useQuery({
    queryKey: ['loans-analysis'],
    queryFn: async () => {
      const response = await api.get<{ data: LoanAnalysis }>('/loans-analysis')
      return response.data.data
    },
  })
}
