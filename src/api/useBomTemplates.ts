import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { Bom } from './useBoms'

// ============================================
// Types
// ============================================

export interface BomTemplateItem {
  id: number
  template_id: number
  type: 'material' | 'labor' | 'overhead'
  component_standard_id: number | null
  component_standard?: {
    id: number
    code: string
    name: string
    category: string
    category_label: string
  }
  product_id: number | null
  product?: {
    id: number
    name: string
    sku: string
    purchase_price: number
  }
  description: string
  default_quantity: number
  unit: string
  is_required: boolean
  is_quantity_variable: boolean
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BomTemplate {
  id: number
  code: string
  name: string
  description: string | null
  category: string
  category_label: string
  default_output_unit: string
  is_active: boolean
  default_rule_set_id: number | null
  default_rule_set?: {
    id: number
    code: string
    name: string
  }
  usage_count: number
  items_count?: number
  items?: BomTemplateItem[]
  creator?: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface BomTemplateFilters {
  page?: number
  per_page?: number
  category?: string
  is_active?: boolean
  search?: string
}

export interface BomTemplateInput {
  code: string
  name: string
  description?: string
  category: string
  default_output_unit?: string
  default_rule_set_id?: number | null
  is_active?: boolean
}

export interface BomTemplateItemInput {
  type: 'material' | 'labor' | 'overhead'
  component_standard_id?: number | null
  product_id?: number | null
  description: string
  default_quantity: number
  unit: string
  is_required?: boolean
  is_quantity_variable?: boolean
  notes?: string
}

export interface BomTemplateMetadata {
  categories: Record<string, string>
  item_types: Record<string, string>
  units: string[]
  rule_sets: Array<{ id: number; code: string; name: string; is_default: boolean }>
}

export interface AvailableBrand {
  code: string
  name: string
  coverage: number
  coverage_percent: number
}

export interface CreateBomPreviewItem {
  template_item_id: number
  type: string
  description: string
  quantity: number
  unit: string
  unit_cost: number
  product: { id: number; name: string; sku: string; brand: string; purchase_price: number } | null
  component_standard: { id: number; code: string; name: string } | null
  status: 'resolved' | 'no_mapping' | 'using_product'
  notes: string | null
  is_required: boolean
  is_quantity_variable: boolean
}

export interface CreateBomPreview {
  items: CreateBomPreviewItem[]
  report: {
    template_id: number
    template_code: string
    target_brand: string | null
    total_items: number
    resolved: number
    no_mapping: number
    using_product: number
  }
}

export interface CreateBomInput {
  product_id: number
  target_brand?: string
  name?: string
  notes?: string
  output_quantity?: number
  quantity_overrides?: Record<number, number>
}

export interface CreateBomResult {
  bom: Bom
  report: {
    template_id: number
    template_code: string
    target_brand: string | null
    total_items: number
    resolved: number
    no_mapping: number
    using_product: number
    items: Array<{
      status: string
      bom_item_data: Record<string, unknown>
      product: Record<string, unknown> | null
      notes: string | null
    }>
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
export function useBomTemplate(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['bom-template', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: BomTemplate }>(`/bom-templates/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
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
export function useTemplateAvailableBrands(templateId: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['bom-template', templateId.value, 'brands']),
    queryFn: async () => {
      const response = await api.get<{ data: AvailableBrand[] }>(
        `/bom-templates/${templateId.value}/available-brands`
      )
      return response.data.data
    },
    enabled: computed(() => !!templateId.value && templateId.value > 0),
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
    mutationFn: async (data: BomTemplateInput) => {
      const response = await api.post<{ data: BomTemplate }>('/bom-templates', data)
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<BomTemplateInput> }) => {
      const response = await api.put<{ data: BomTemplate }>(`/bom-templates/${id}`, data)
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
    mutationFn: async (id: number) => {
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
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: BomTemplate }>(`/bom-templates/${id}/duplicate`)
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
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: BomTemplate }>(`/bom-templates/${id}/toggle-active`)
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
    mutationFn: async ({ templateId, data }: { templateId: number; data: BomTemplateItemInput }) => {
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
      templateId: number
      itemId: number
      data: Partial<BomTemplateItemInput>
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
    mutationFn: async ({ templateId, itemId }: { templateId: number; itemId: number }) => {
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
    mutationFn: async ({ templateId, itemIds }: { templateId: number; itemIds: number[] }) => {
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
      templateId: number
      data: Partial<CreateBomInput>
    }) => {
      const response = await api.post<{ data: CreateBomPreview }>(
        `/bom-templates/${templateId}/preview-bom`,
        data
      )
      return response.data.data
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
      templateId: number
      data: CreateBomInput
    }) => {
      const response = await api.post<{ message: string; data: CreateBomResult }>(
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
