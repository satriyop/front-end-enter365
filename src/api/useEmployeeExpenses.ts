import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'

export type EmployeeExpenseStatus = 'draft' | 'submitted' | 'approved' | 'posted' | 'refused' | 'cancelled'

export interface EmployeeExpense {
  id: number
  expense_number: string
  employee_id: number
  contact_id?: number | null
  expense_date: string
  description: string
  amount: number
  tax_amount: number
  total_amount: number
  expense_account_id: number
  status: EmployeeExpenseStatus
  journal_entry_id?: number | null
  notes?: string | null
  employee?: { id: number; name: string; email: string } | null
  contact?: { id: number; name: string } | null
  expense_account?: { id: number; code: string; name: string } | null
}

export interface EmployeeExpenseFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
  employee_id?: number
}

export interface CreateEmployeeExpenseData {
  employee_id: number
  contact_id?: number | null
  expense_date: string
  description: string
  amount: number
  tax_amount?: number
  expense_account_id: number
  notes?: string | null
}

export type UpdateEmployeeExpenseData = Partial<CreateEmployeeExpenseData>

const hooks = createCrudHooks<
  EmployeeExpense,
  EmployeeExpenseFilters,
  CreateEmployeeExpenseData,
  UpdateEmployeeExpenseData
>({
  resourceName: 'employee-expenses',
  singularName: 'employeeExpense',
})

export const useEmployeeExpenses = hooks.useList
export const useEmployeeExpense = hooks.useSingle
export const useCreateEmployeeExpense = hooks.useCreate
export const useUpdateEmployeeExpense = hooks.useUpdate
export const useDeleteEmployeeExpense = hooks.useDelete

function useExpenseAction(action: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: EmployeeExpense }>(
        '/employee-expenses/' + payload.id + '/' + action,
        action === 'refuse' || action === 'cancel' ? { reason: payload.reason } : undefined,
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['employeeExpense'] })
    },
  })
}

export function useSubmitEmployeeExpense() {
  return useExpenseAction('submit')
}

export function useApproveEmployeeExpense() {
  return useExpenseAction('approve')
}

export function useRefuseEmployeeExpense() {
  return useExpenseAction('refuse')
}

export function usePostEmployeeExpense() {
  return useExpenseAction('post')
}

export function useCancelEmployeeExpense() {
  return useExpenseAction('cancel')
}
