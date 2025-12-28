import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'

// ============================================
// Types
// ============================================

export interface ComponentBrandMapping {
  id: number
  component_standard_id: number
  brand: string
  brand_label: string
  product_id: number
  product?: {
    id: number
    name: string
    sku: string
    purchase_price: number
    selling_price: number
    current_stock: number
  }
  brand_sku: string
  is_preferred: boolean
  is_verified: boolean
  price_factor: number
  variant_specs: Record<string, unknown> | null
  notes: string | null
  verified_by: number | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface ComponentStandard {
  id: number
  code: string
  name: string
  category: string
  category_label: string
  subcategory: string | null
  specifications: Record<string, unknown>
  standard: string | null
  unit: string
  is_active: boolean
  brand_mappings?: ComponentBrandMapping[]
  brand_mappings_count?: number
  available_brands?: string[]
  creator?: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface ComponentStandardFilters {
  page?: number
  per_page?: number
  category?: string
  subcategory?: string
  is_active?: boolean
  search?: string
  brand?: string
  specs?: Record<string, unknown>
}

export interface ComponentStandardInput {
  code: string
  name: string
  category: string
  subcategory?: string
  specifications: Record<string, unknown>
  standard?: string
  unit: string
  is_active?: boolean
}

export interface BrandMappingInput {
  brand: string
  product_id: number
  brand_sku: string
  is_preferred?: boolean
  price_factor?: number
  variant_specs?: Record<string, unknown>
  notes?: string
}

export interface Brand {
  code: string
  name: string
}

export interface Category {
  category: string
  label: string
  count: number
}

// ============================================
// Component Standards Query Hooks
// ============================================

/**
 * Fetch paginated list of component standards
 */
export function useComponentStandards(filters: Ref<ComponentStandardFilters>) {
  return useQuery({
    queryKey: computed(() => ['component-standards', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<ComponentStandard>>('/component-standards', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch single component standard by ID
 */
export function useComponentStandard(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['component-standard', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: ComponentStandard }>(`/component-standards/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch all categories with counts
 */
export function useComponentCategories() {
  return useQuery({
    queryKey: ['component-standards', 'categories'],
    queryFn: async () => {
      const response = await api.get<{ data: Category[] }>('/component-standards/categories')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch available brands for a component standard
 */
export function useStandardBrands(standardId: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['component-standard', standardId.value, 'brands']),
    queryFn: async () => {
      const response = await api.get<{ data: Brand[] }>(`/component-standards/${standardId.value}/brands`)
      return response.data.data
    },
    enabled: computed(() => !!standardId.value && standardId.value > 0),
  })
}

/**
 * Fetch all available brands from mappings
 */
export function useAvailableBrands() {
  return useQuery({
    queryKey: ['available-brands'],
    queryFn: async () => {
      const response = await api.get<{ data: Brand[] }>('/available-brands')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// Component Standards Mutation Hooks
// ============================================

/**
 * Create a new component standard
 */
export function useCreateComponentStandard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ComponentStandardInput) => {
      const response = await api.post<{ data: ComponentStandard }>('/component-standards', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-standards'] })
    },
  })
}

/**
 * Update an existing component standard
 */
export function useUpdateComponentStandard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ComponentStandardInput> }) => {
      const response = await api.put<{ data: ComponentStandard }>(`/component-standards/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['component-standards'] })
      queryClient.invalidateQueries({ queryKey: ['component-standard', variables.id] })
    },
  })
}

/**
 * Delete a component standard
 */
export function useDeleteComponentStandard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/component-standards/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['component-standards'] })
    },
  })
}

// ============================================
// Brand Mapping Mutation Hooks
// ============================================

/**
 * Add a brand mapping to a component standard
 */
export function useAddBrandMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ standardId, data }: { standardId: number; data: BrandMappingInput }) => {
      const response = await api.post<{ data: ComponentBrandMapping }>(
        `/component-standards/${standardId}/mappings`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['component-standard', variables.standardId] })
      queryClient.invalidateQueries({ queryKey: ['component-standards'] })
      queryClient.invalidateQueries({ queryKey: ['available-brands'] })
    },
  })
}

/**
 * Update a brand mapping
 */
export function useUpdateBrandMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      standardId,
      mappingId,
      data
    }: {
      standardId: number
      mappingId: number
      data: Partial<BrandMappingInput>
    }) => {
      const response = await api.put<{ data: ComponentBrandMapping }>(
        `/component-standards/${standardId}/mappings/${mappingId}`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['component-standard', variables.standardId] })
    },
  })
}

/**
 * Delete a brand mapping
 */
export function useDeleteBrandMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ standardId, mappingId }: { standardId: number; mappingId: number }) => {
      await api.delete(`/component-standards/${standardId}/mappings/${mappingId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['component-standard', variables.standardId] })
      queryClient.invalidateQueries({ queryKey: ['component-standards'] })
    },
  })
}

/**
 * Verify a brand mapping
 */
export function useVerifyBrandMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ standardId, mappingId }: { standardId: number; mappingId: number }) => {
      const response = await api.post<{ data: ComponentBrandMapping }>(
        `/component-standards/${standardId}/mappings/${mappingId}/verify`
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['component-standard', variables.standardId] })
    },
  })
}

/**
 * Set a brand mapping as preferred
 */
export function useSetPreferredMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ standardId, mappingId }: { standardId: number; mappingId: number }) => {
      const response = await api.post<{ data: ComponentBrandMapping }>(
        `/component-standards/${standardId}/mappings/${mappingId}/set-preferred`
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['component-standard', variables.standardId] })
    },
  })
}

// ============================================
// Cross-Reference Query Hooks
// ============================================

export interface EquivalentProduct {
  id: number
  component_standard_id: number
  brand: string
  brand_label: string
  product_id: number
  product: {
    id: number
    name: string
    sku: string
    purchase_price: number
    selling_price: number
    current_stock: number
  }
  brand_sku: string
  is_preferred: boolean
  price_factor: number
}

/**
 * Find equivalent products for a given product
 */
export function useProductEquivalents(productId: Ref<number>, targetBrand?: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['product-equivalents', productId.value, targetBrand?.value]),
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (targetBrand?.value) {
        params.brand = targetBrand.value
      }
      const response = await api.get<{
        data: EquivalentProduct[]
        source_product: { id: number; name: string; sku: string; brand: string }
      }>(`/products/${productId.value}/equivalents`, { params })
      return response.data
    },
    enabled: computed(() => !!productId.value && productId.value > 0),
  })
}

/**
 * Search components by specifications
 */
export function useComponentSearch(
  category: Ref<string>,
  specs: Ref<Record<string, unknown>>,
  brand?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: computed(() => ['component-search', category.value, specs.value, brand?.value]),
    queryFn: async () => {
      const response = await api.post<{ data: ComponentStandard[] }>('/component-search', {
        category: category.value,
        specs: specs.value,
        brand: brand?.value,
      })
      return response.data.data
    },
    enabled: computed(() => !!category.value),
  })
}

// ============================================
// BOM Brand Swap Hooks
// ============================================

export interface SwapReportItem {
  status: 'swapped' | 'no_mapping' | 'partial_match'
  original: {
    product_id: number
    description: string
    unit_cost: number
  }
  new?: {
    product_id: number
    description: string
    unit_cost: number
    brand_sku: string
  }
  notes?: string
}

export interface SwapReport {
  total_items: number
  swapped: number
  no_mapping: number
  partial_match: number
  items: SwapReportItem[]
}

export interface BomVariantGroup {
  id: number
  name: string
  description: string | null
  primary_bom_id: number
  primary_bom?: {
    id: number
    bom_number: string
    name: string
  }
  boms?: Array<{
    id: number
    bom_number: string
    name: string
    variant_label: string
    total_cost: number
    is_primary_variant: boolean
  }>
  boms_count: number
  created_at: string
  updated_at: string
}

// ============================================
// Swap Preview Types
// ============================================

export interface SwapPreviewItem {
  description: string
  quantity: number
  current_unit_cost: number
  current_total: number
  estimated_unit_cost: number
  estimated_total: number
  cost_change: number
  can_swap: boolean
  target_product: string | null
  target_sku: string | null
}

export interface SwapPreview {
  target_brand: string
  current_total: number
  estimated_total: number
  savings: number
  savings_percentage: number
  coverage: {
    total: number
    swappable: number
    no_mapping: number
    percentage: number
  }
  items: SwapPreviewItem[]
}

/**
 * Preview swap without creating a new BOM
 */
export function useSwapBrandPreview() {
  return useMutation({
    mutationFn: async ({
      bomId,
      targetBrand
    }: {
      bomId: number
      targetBrand: string
    }) => {
      const response = await api.post<{ data: SwapPreview }>(
        `/boms/${bomId}/swap-brand-preview`,
        { target_brand: targetBrand }
      )
      return response.data.data
    },
  })
}

// ============================================
// Brand Comparison Types
// ============================================

export interface BrandComparisonItem {
  brand: string
  brand_label: string
  estimated_total: number
  savings: number
  savings_percentage: number
  coverage_percentage: number
  swappable_items: number
  no_mapping_items: number
}

export interface BrandComparison {
  current: {
    total: number
    total_items: number
  }
  brands: BrandComparisonItem[]
  recommendations: {
    best_value: string | null
    best_coverage: string | null
  }
}

/**
 * Get brand comparison for a BOM (all brands at once)
 */
export function useBrandComparison(bomId: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['bom-brand-comparison', bomId.value]),
    queryFn: async () => {
      const response = await api.get<{ data: BrandComparison }>(
        `/boms/${bomId.value}/brand-comparison`
      )
      return response.data.data
    },
    enabled: computed(() => !!bomId.value && bomId.value > 0),
    staleTime: 30 * 1000, // Cache for 30 seconds
  })
}

/**
 * Swap BOM to a different brand
 */
export function useSwapBomBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bomId,
      targetBrand,
      createVariant = true,
      variantGroupId
    }: {
      bomId: number
      targetBrand: string
      createVariant?: boolean
      variantGroupId?: number
    }) => {
      const response = await api.post<{
        message: string
        data: {
          bom: { id: number; bom_number: string; name: string }
          swap_report: SwapReport
        }
      }>(`/boms/${bomId}/swap-brand`, {
        target_brand: targetBrand,
        create_variant: createVariant,
        variant_group_id: variantGroupId
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      queryClient.invalidateQueries({ queryKey: ['bom-variant-groups'] })
    },
  })
}

/**
 * Generate all brand variants for a BOM
 */
export function useGenerateBrandVariants() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bomId,
      brands,
      groupName
    }: {
      bomId: number
      brands: string[]
      groupName?: string
    }) => {
      const response = await api.post<{
        message: string
        data: {
          variant_group: BomVariantGroup
          boms: Array<{ id: number; bom_number: string; name: string; variant_label: string }>
          report: Record<string, SwapReport>
        }
      }>(`/boms/${bomId}/generate-brand-variants`, {
        brands,
        group_name: groupName
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      queryClient.invalidateQueries({ queryKey: ['bom-variant-groups'] })
    },
  })
}

// ============================================
// BOM Variant Group Hooks
// ============================================

export interface VariantGroupFilters {
  page?: number
  per_page?: number
  search?: string
}

/**
 * Fetch paginated list of variant groups
 */
export function useBomVariantGroups(filters: Ref<VariantGroupFilters>) {
  return useQuery({
    queryKey: computed(() => ['bom-variant-groups', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<BomVariantGroup>>('/bom-variant-groups', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch a single variant group with BOMs
 */
export function useBomVariantGroup(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['bom-variant-group', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: BomVariantGroup }>(`/bom-variant-groups/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Get comparison data for a variant group
 */
export function useVariantGroupComparison(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['bom-variant-group', id.value, 'compare']),
    queryFn: async () => {
      const response = await api.get<{
        data: {
          group: BomVariantGroup
          boms: Array<{
            id: number
            bom_number: string
            variant_label: string
            total_cost: number
            is_primary: boolean
          }>
          comparison: {
            lowest_cost_bom_id: number
            highest_cost_bom_id: number
            cost_range: { min: number; max: number; difference: number }
          }
        }
      }>(`/bom-variant-groups/${id.value}/compare`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Delete a variant group
 */
export function useDeleteBomVariantGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bom-variant-groups/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom-variant-groups'] })
    },
  })
}

// ============================================
// Cost Optimization Types & Hooks
// ============================================

export interface CostOptimizationItem {
  bom_item_id: number
  description: string
  quantity: number
  unit: string
  current_brand: string | null
  current_unit_cost: number
  current_total: number
  cheapest_brand: string | null
  cheapest_brand_label: string | null
  cheapest_unit_cost: number
  cheapest_total: number
  cheapest_product_id: number | null
  cheapest_product_name: string | null
  cheapest_sku: string | null
  savings: number
  savings_percentage: number
  can_optimize: boolean
  is_already_cheapest: boolean
}

export interface CostOptimizationPreview {
  current_total: number
  optimized_total: number
  savings: number
  savings_percentage: number
  summary: {
    total_items: number
    can_optimize: number
    already_cheapest: number
    no_alternative: number
  }
  items: CostOptimizationItem[]
}

export interface CostOptimizationReportItem {
  status: 'optimized' | 'already_cheapest' | 'no_alternative' | 'excluded'
  original: {
    description: string
    brand?: string
    unit_cost: number
  }
  new?: {
    description: string
    brand: string
    brand_label: string
    unit_cost: number
    sku: string
  }
  savings: number
}

export interface CostOptimizationReport {
  total_items: number
  optimized: number
  kept_original: number
  total_savings: number
  items: CostOptimizationReportItem[]
}

/**
 * Preview cost optimization (find cheapest per item across all brands)
 */
export function useCostOptimizationPreview(bomId: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['bom-cost-optimization', bomId.value]),
    queryFn: async () => {
      const response = await api.get<{ data: CostOptimizationPreview }>(
        `/boms/${bomId.value}/cost-optimization`
      )
      return response.data.data
    },
    enabled: computed(() => !!bomId.value && bomId.value > 0),
    staleTime: 30 * 1000,
  })
}

/**
 * Apply cost optimization to create a new BOM
 */
export function useApplyCostOptimization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      bomId,
      itemIds
    }: {
      bomId: number
      itemIds?: number[]
    }) => {
      const response = await api.post<{
        message: string
        data: {
          bom: { id: number; bom_number: string; name: string }
          optimization_report: CostOptimizationReport
        }
      }>(`/boms/${bomId}/apply-cost-optimization`, {
        item_ids: itemIds
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
  })
}
