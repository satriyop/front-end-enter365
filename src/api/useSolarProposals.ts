import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types from OpenAPI spec
// ============================================

export type SolarProposal = components['schemas']['SolarProposalResource']
export type SolarProposalList = components['schemas']['SolarProposalListResource']
export type IndonesiaSolarData = components['schemas']['IndonesiaSolarDataResource']
export type PlnTariff = components['schemas']['PlnTariffResource']

export interface SolarProposalFilters {
  page?: number
  per_page?: number
  status?: string
  search?: string
  contact_id?: number
  province?: string
  city?: string
  date_from?: string
  date_to?: string
}

export interface CreateSolarProposalData {
  contact_id: number
  // Site Information
  site_name?: string
  site_address?: string
  province?: string
  city?: string
  latitude?: number | null
  longitude?: number | null
  roof_area_m2?: number | null
  roof_type?: 'flat' | 'sloped' | 'carport'
  roof_orientation?: 'north' | 'south' | 'east' | 'west'
  roof_tilt_degrees?: number | null
  shading_percentage?: number | null
  // Electricity Profile
  monthly_consumption_kwh?: number | null
  pln_tariff_category?: string
  electricity_rate?: number | null
  tariff_escalation_percent?: number | null
  // Solar Data
  peak_sun_hours?: number | null
  solar_irradiance?: number | null
  performance_ratio?: number | null
  // System Selection
  variant_group_id?: number | null
  selected_bom_id?: number | null
  system_capacity_kwp?: number | null
  // Proposal Settings
  valid_until?: string
  notes?: string
}

export interface UpdateSolarProposalData extends Partial<CreateSolarProposalData> {}

export interface SolarProposalStatistics {
  total: number
  draft: number
  sent: number
  accepted: number
  rejected: number
  expired: number
  conversion_rate: number
  total_capacity_kwp: number
  average_system_size: number
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of solar proposals
 */
export function useSolarProposals(filters: Ref<SolarProposalFilters>) {
  return useQuery({
    queryKey: computed(() => ['solar-proposals', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<SolarProposalList>>('/solar-proposals', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch single solar proposal by ID
 */
export function useSolarProposal(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['solar-proposal', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: SolarProposal }>(`/solar-proposals/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch solar proposal statistics
 */
export function useSolarProposalStatistics() {
  return useQuery({
    queryKey: ['solar-proposals', 'statistics'],
    queryFn: async () => {
      const response = await api.get<{ data: SolarProposalStatistics }>('/solar-proposals-statistics')
      return response.data.data
    },
  })
}

// ============================================
// Solar Data Lookup Hooks
// ============================================

/**
 * Lookup solar data by location (province + city or coordinates)
 */
export function useSolarDataLookup(params: Ref<{ province?: string; city?: string; latitude?: number; longitude?: number }>) {
  return useQuery({
    queryKey: computed(() => ['solar-data', 'lookup', params.value]),
    queryFn: async () => {
      const response = await api.get<{ data: IndonesiaSolarData }>('/solar-data/lookup', {
        params: params.value
      })
      return response.data.data
    },
    enabled: computed(() => {
      const p = params.value
      return (!!p.province && !!p.city) || (!!p.latitude && !!p.longitude)
    }),
  })
}

/**
 * Get list of provinces with solar data
 */
export function useSolarProvinces() {
  return useQuery({
    queryKey: ['solar-data', 'provinces'],
    queryFn: async () => {
      const response = await api.get<{ data: string[] }>('/solar-data/provinces')
      return response.data.data
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (static data)
  })
}

/**
 * Get list of cities in a province
 */
export function useSolarCities(province: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['solar-data', 'cities', province.value]),
    queryFn: async () => {
      const response = await api.get<{ data: string[] }>('/solar-data/cities', {
        params: { province: province.value }
      })
      return response.data.data
    },
    enabled: computed(() => !!province.value),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  })
}

/**
 * Get all solar data locations
 */
export function useSolarLocations() {
  return useQuery({
    queryKey: ['solar-data', 'locations'],
    queryFn: async () => {
      const response = await api.get<{ data: IndonesiaSolarData[] }>('/solar-data/locations')
      return response.data.data
    },
    staleTime: 1000 * 60 * 60,
  })
}

// ============================================
// PLN Tariff Hooks
// ============================================

/**
 * Get all PLN tariffs
 */
export function usePlnTariffs() {
  return useQuery({
    queryKey: ['pln-tariffs'],
    queryFn: async () => {
      const response = await api.get<{ data: PlnTariff[] }>('/pln-tariffs')
      return response.data.data
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (rarely changes)
  })
}

/**
 * Get single PLN tariff by category
 */
export function usePlnTariff(category: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['pln-tariff', category.value]),
    queryFn: async () => {
      const response = await api.get<{ data: PlnTariff }>(`/pln-tariffs/${encodeURIComponent(category.value!)}`)
      return response.data.data
    },
    enabled: computed(() => !!category.value),
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create new solar proposal
 */
export function useCreateSolarProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSolarProposalData) => {
      const response = await api.post<{ data: SolarProposal }>('/solar-proposals', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solar-proposals'] })
    },
  })
}

/**
 * Update solar proposal (draft only)
 */
export function useUpdateSolarProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSolarProposalData }) => {
      const response = await api.put<{ data: SolarProposal }>(`/solar-proposals/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solar-proposals'] })
      queryClient.setQueryData(['solar-proposal', data.id], data)
    },
  })
}

/**
 * Delete solar proposal (draft only)
 */
export function useDeleteSolarProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/solar-proposals/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['solar-proposals'] })
      queryClient.removeQueries({ queryKey: ['solar-proposal', id] })
    },
  })
}

/**
 * Calculate/recalculate all proposal values
 */
export function useCalculateSolarProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: SolarProposal }>(`/solar-proposals/${id}/calculate`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['solar-proposal', data.id], data)
    },
  })
}

/**
 * Attach a BOM variant group to the proposal
 */
export function useAttachSolarVariants() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, variant_group_id }: { id: number; variant_group_id: number }) => {
      const response = await api.post<{ data: SolarProposal }>(`/solar-proposals/${id}/attach-variants`, {
        variant_group_id
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['solar-proposal', data.id], data)
    },
  })
}

/**
 * Select a specific BOM from the variant group
 */
export function useSelectSolarBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, bom_id }: { id: number; bom_id: number }) => {
      const response = await api.post<{ data: SolarProposal }>(`/solar-proposals/${id}/select-bom`, {
        bom_id
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['solar-proposal', data.id], data)
    },
  })
}

/**
 * Send proposal to customer
 */
export function useSendSolarProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: SolarProposal }>(`/solar-proposals/${id}/send`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solar-proposals'] })
      queryClient.setQueryData(['solar-proposal', data.id], data)
    },
  })
}

/**
 * Customer accepts proposal
 */
export function useAcceptSolarProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, selected_bom_id }: { id: number; selected_bom_id?: number }) => {
      const response = await api.post<{ data: SolarProposal }>(`/solar-proposals/${id}/accept`, {
        selected_bom_id
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solar-proposals'] })
      queryClient.setQueryData(['solar-proposal', data.id], data)
    },
  })
}

/**
 * Customer rejects proposal
 */
export function useRejectSolarProposal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: SolarProposal }>(`/solar-proposals/${id}/reject`, {
        rejection_reason: reason
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solar-proposals'] })
      queryClient.setQueryData(['solar-proposal', data.id], data)
    },
  })
}

/**
 * Convert accepted proposal to quotation
 */
export function useConvertSolarToQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        message: string
        quotation: { id: number }
        proposal: SolarProposal
      }>(`/solar-proposals/${id}/convert-to-quotation`)
      return {
        quotation_id: response.data.quotation.id,
        proposal: response.data.proposal,
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['solar-proposals'] })
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['solar-proposal', data.proposal.id], data.proposal)
    },
  })
}

/**
 * Download proposal PDF
 */
export async function downloadSolarProposalPdf(id: number, filename?: string) {
  const response = await api.get(`/solar-proposals/${id}/pdf`, {
    responseType: 'blob'
  })

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename || `solar-proposal-${id}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Download proposal Excel
 */
export async function downloadSolarProposalExcel(id: number, filename?: string) {
  const response = await api.get(`/solar-proposals/${id}/excel`, {
    responseType: 'blob'
  })

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename || `solar-proposal-${id}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
