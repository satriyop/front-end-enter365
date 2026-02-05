/**
 * BOM Templates API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref, type ComputedRef } from 'vue'
import { api, type PaginatedResponse, type ApiRequest, type ApiResponse } from './client'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type BomTemplate = components['schemas']['BomTemplateResource']
export type BomTemplateItem = components['schemas']['BomTemplateItemResource']

export interface BomTemplateFilters {
  page?: number
  per_page?: number
  category?: string
  is_active?: boolean
  search?: string
}

// Use Scramble-generated request types directly
export type StoreBomTemplateRequest = components['schemas']['StoreBomTemplateRequest']
export type UpdateBomTemplateRequest = components['schemas']['UpdateBomTemplateRequest']
export type StoreBomTemplateItemRequest = components['schemas']['StoreBomTemplateItemRequest']
export type UpdateBomTemplateItemRequest = components['schemas']['UpdateBomTemplateItemRequest']

export interface BomTemplateMetadata {
  categories: Record<string, string>
  item_types: Record<string, string>
}

// Using ApiResponse utility for consistent unwrapping
export type AvailableBrand = ApiResponse<paths['/bom-templates/{bomTemplate}/available-brands']['get']>[number]

export interface CreateBomPreview {
  data: Array<{
    template_item_id: number
    type: string
    description: string
    quantity: number
    unit: string
    unit_cost: number
    product: components['schemas']['ProductResource'] | null
    component_standard: components['schemas']['ComponentStandardResource'] | null
    status: string
    notes: string | null
    is_required: boolean
    is_quantity_variable: boolean
  }>
  report: {
    total_items: number
    resolved: number
    using_product: number
    no_mapping: number
  }
}

export type CreateBomPreviewItem = CreateBomPreview['data'][number]

export type CreateBomFromTemplateRequest = ApiRequest<paths['/bom-templates/{bomTemplate}/create-bom']['post']>

export interface CreateBomResult {
  message: string
  data: components['schemas']['BomResource']
  report: {
    total_items: number
    resolved: number
    using_product: number
    no_mapping: number
  }
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of BOM templates
 */
export function useBomTemplates(filters: Ref<BomTemplateFilters>) {
  return useQuery({
    queryKey: computed(() => ['bom-templates', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<BomTemplate>>('/bom-templates', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch single BOM template by ID
 */
export function useBomTemplate(id: Ref<number | string | null | undefined> | ComputedRef<number | string | null | undefined>) {
  return useQuery({
    queryKey: computed(() => ['bom-template', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: BomTemplate }>(`/bom-templates/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value),
  })
}

/**
 * Fetch metadata for creating templates
 */
export function useBomTemplateMetadata() {
  return useQuery({
    queryKey: ['bom-templates', 'metadata'],
    queryFn: async () => {
      const response = await api.get<{ data: BomTemplateMetadata }>('/bom-templates/metadata')
      return response.data.data
    },
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Fetch active templates for dropdown
 */
export function useActiveTemplates() {
  return useQuery({
    queryKey: ['bom-templates', 'active'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<BomTemplate>>('/bom-templates', {
        params: { is_active: true, per_page: 100 }
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch available brands for a template
 */
export function useTemplateAvailableBrands(id: Ref<number | string | null | undefined> | ComputedRef<number | string | null | undefined>) {
  return useQuery({
    queryKey: computed(() => ['bom-template', id.value, 'brands']),
    queryFn: async () => {
      const response = await api.get<{ data: AvailableBrand[]; meta: any }>(
        `/bom-templates/${id.value}/available-brands`
      )
      return response.data.data
    },
    enabled: computed(() => !!id.value),
    staleTime: 30 * 1000,
  })
}

// ============================================
// Template Mutation Hooks
// ============================================

/**
 * Create a new BOM template
 */
export function useCreateBomTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StoreBomTemplateRequest) => {
      const response = await api.post<{ data: BomTemplate }>('/bom-templates', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom-templates'] })
    },
  })
}

/**
 * Update an existing BOM template
 */
export function useUpdateBomTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: UpdateBomTemplateRequest }) => {
      // For multipart/form-data with PUT, we often need method spoofing in Laravel
      const response = await api.post<{ data: BomTemplate }>(`/bom-templates/${id}`, {
        ...data,
        _method: 'PUT'
      }, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom-templates'] })
      queryClient.invalidateQueries({ queryKey: ['bom-template', variables.id] })
    },
  })
}

/**
 * Delete a BOM template
 */
export function useDeleteBomTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/bom-templates/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom-templates'] })
    },
  })
}

/**
 * Duplicate a BOM template
 */
export function useDuplicateBomTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: number | string; code: string; name?: string }) => {
      const { id, ...data } = params
      const response = await api.post<{ data: BomTemplate }>(`/bom-templates/${id}/duplicate`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom-templates'] })
    },
  })
}

/**
 * Toggle template active status
 */
export function useToggleTemplateActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: BomTemplate; message: string }>(`/bom-templates/${id}/toggle-active`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bom-templates'] })
      queryClient.invalidateQueries({ queryKey: ['bom-template', id] })
    },
  })
}

// ============================================
// Template Item Mutation Hooks
// ============================================

/**
 * Add an item to a template
 */
export function useAddTemplateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ templateId, data }: { templateId: number | string; data: StoreBomTemplateItemRequest }) => {
      const response = await api.post<{ data: BomTemplateItem }>(
        `/bom-templates/${templateId}/items`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom-template', variables.templateId] })
    },
  })
}

/**
 * Update a template item
 */
export function useUpdateTemplateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      templateId,
      itemId,
      data
    }: {
      templateId: number | string
      itemId: number | string
      data: UpdateBomTemplateItemRequest
    }) => {
      const response = await api.put<{ data: BomTemplateItem }>(
        `/bom-templates/${templateId}/items/${itemId}`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom-template', variables.templateId] })
    },
  })
}

/**
 * Delete a template item
 */
export function useDeleteTemplateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ templateId, itemId }: { templateId: number | string; itemId: number | string }) => {
      await api.delete(`/bom-templates/${templateId}/items/${itemId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom-template', variables.templateId] })
    },
  })
}

/**
 * Reorder template items
 */
export function useReorderTemplateItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ templateId, itemIds }: { templateId: number | string; itemIds: number[] }) => {
      const response = await api.post<{ message: string; data: BomTemplate }>(
        `/bom-templates/${templateId}/items/reorder`,
        { item_ids: itemIds }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom-template', variables.templateId] })
    },
  })
}

// ============================================
// Create BOM from Template Hooks
// ============================================

/**
 * Preview creating a BOM from template
 */
export function usePreviewCreateBom() {
  return useMutation({
    mutationFn: async ({
      templateId,
      data
    }: {
      templateId: number | string
      data: { target_brand?: string; quantity_overrides?: Record<number, number> }
    }) => {
      const response = await api.post<CreateBomPreview>(
        `/bom-templates/${templateId}/preview-bom`,
        data
      )
      return response.data
    },
  })
}

/**
 * Create a BOM from template
 */
export function useCreateBomFromTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      templateId,
      data
    }: {
      templateId: number | string
      data: CreateBomFromTemplateRequest
    }) => {
      const response = await api.post<CreateBomResult>(
        `/bom-templates/${templateId}/create-bom`,
        data
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bom-templates'] })
      queryClient.invalidateQueries({ queryKey: ['bom-template', variables.templateId] })
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
  })
}
