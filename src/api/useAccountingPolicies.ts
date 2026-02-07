import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'

export interface AccountingPolicyData {
  id: number
  inventory_method: string
  cogs_recognition: string
  return_accounting: string
  manufacturing_costing: string
  closing_strategy: string
  updated_at: string
}

export interface AccountingPolicyResponse {
  data: AccountingPolicyData
  meta: {
    available_options: Record<string, string[]>
    descriptions: Record<string, Record<string, string>>
  }
}

export function useAccountingPolicies() {
  return useQuery({
    queryKey: ['accounting-policies'],
    queryFn: async () => {
      const response = await api.get<AccountingPolicyResponse>('/accounting-policies')
      return response.data
    },
  })
}

export function useUpdateAccountingPolicies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const response = await api.put<{ data: AccountingPolicyData }>('/accounting-policies', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-policies'] })
    },
  })
}
