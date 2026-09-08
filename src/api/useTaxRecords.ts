import { useQuery } from '@tanstack/vue-query'
import { api } from './client'

export interface TaxRecord {
  id: number
  code: string
  name: string
  rate: number
  applicability: 'sales' | 'purchase' | 'both'
  is_active: boolean
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
