import { computed, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'

export interface TaxRecord {
  id: number
  code: string
  name: string
  rate: number
  computation?: string
  applicability: 'sales' | 'purchase' | 'both'
  is_active: boolean
  invoice_account_id?: number | null
  refund_account_id?: number | null
  tax_tag_id?: number | null
}

export type CreateTaxRecordData = {
  code: string
  name: string
  rate: number
  applicability: TaxRecord['applicability']
  computation?: string
  is_active?: boolean
  invoice_account_id?: number | null
  refund_account_id?: number | null
  tax_tag_id?: number | null
}

export function useTaxRecords(applicability?: 'sales' | 'purchase') {
  return useQuery({
    queryKey: ['tax-records', applicability],
    queryFn: async () => {
      const params: Record<string, string> = { is_active: '1', per_page: '100' }
      if (applicability) params.applicability = applicability
      const response = await api.get<{ data: TaxRecord[] }>('/tax-records', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTaxRecord(id: Ref<string>) {
  return useQuery({
    queryKey: computed(() => ['tax-records', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: TaxRecord[] }>('/tax-records', { params: { per_page: '200' } })
      return response.data.data.find((row) => String(row.id) === id.value) ?? null
    },
    enabled: computed(() => !!id.value),
  })
}

export function useCreateTaxRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateTaxRecordData) => {
      const response = await api.post<{ data: TaxRecord }>('/tax-records', data)
      return response.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tax-records'] }),
  })
}

export function useUpdateTaxRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<CreateTaxRecordData> }) => {
      const response = await api.put<{ data: TaxRecord }>(`/tax-records/${id}`, data)
      return response.data.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tax-records'] }),
  })
}

export function useDeleteTaxRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/tax-records/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tax-records'] }),
  })
}
