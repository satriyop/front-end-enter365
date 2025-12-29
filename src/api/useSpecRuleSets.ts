import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'

// ============================================
// Types
// ============================================

export interface SpecValidationRule {
  id: number
  rule_set_id: number
  category: string
  category_label: string
  spec_key: string
  validation_type: string
  validation_type_label: string
  allowed_values: unknown[] | null
  tolerance_percent: number | null
  severity: string
  severity_label: string
  error_message: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SpecValidationRuleSet {
  id: number
  code: string
  name: string
  description: string | null
  is_default: boolean
  is_active: boolean
  rules_count?: number
  rules?: SpecValidationRule[]
  boms_count?: number
  creator?: { id: number; name: string }
  created_at: string
  updated_at: string
}

export interface RuleSetFilters {
  page?: number
  per_page?: number
  is_active?: boolean
  search?: string
}

export interface RuleSetInput {
  code: string
  name: string
  description?: string
  is_default?: boolean
  is_active?: boolean
}

export interface RuleInput {
  category: string
  spec_key: string
  validation_type: string
  allowed_values?: unknown[]
  tolerance_percent?: number
  severity: string
  error_message?: string
  is_active?: boolean
}

export interface RuleSetMetadata {
  categories: Record<string, string>
  validation_types: Record<string, string>
  severity_levels: Record<string, string>
  common_spec_keys: Record<string, string[]>
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of rule sets
 */
export function useSpecRuleSets(filters: Ref<RuleSetFilters>) {
  return useQuery({
    queryKey: computed(() => ['spec-rule-sets', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<SpecValidationRuleSet>>('/spec-rule-sets', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch single rule set by ID
 */
export function useSpecRuleSet(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['spec-rule-set', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: SpecValidationRuleSet }>(`/spec-rule-sets/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch metadata for creating rules
 */
export function useRuleSetMetadata() {
  return useQuery({
    queryKey: ['spec-rule-sets', 'metadata'],
    queryFn: async () => {
      const response = await api.get<{ data: RuleSetMetadata }>('/spec-rule-sets/metadata')
      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  })
}

/**
 * Fetch active rule sets for dropdown
 */
export function useActiveRuleSets() {
  return useQuery({
    queryKey: ['spec-rule-sets', 'active'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<SpecValidationRuleSet>>('/spec-rule-sets', {
        params: { is_active: true, per_page: 100 }
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// Rule Set Mutation Hooks
// ============================================

/**
 * Create a new rule set
 */
export function useCreateRuleSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RuleSetInput) => {
      const response = await api.post<{ data: SpecValidationRuleSet }>('/spec-rule-sets', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec-rule-sets'] })
    },
  })
}

/**
 * Update an existing rule set
 */
export function useUpdateRuleSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RuleSetInput> }) => {
      const response = await api.put<{ data: SpecValidationRuleSet }>(`/spec-rule-sets/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spec-rule-sets'] })
      queryClient.invalidateQueries({ queryKey: ['spec-rule-set', variables.id] })
    },
  })
}

/**
 * Delete a rule set
 */
export function useDeleteRuleSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/spec-rule-sets/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec-rule-sets'] })
    },
  })
}

/**
 * Set a rule set as default
 */
export function useSetDefaultRuleSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ message: string; data: SpecValidationRuleSet }>(
        `/spec-rule-sets/${id}/set-default`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spec-rule-sets'] })
    },
  })
}

// ============================================
// Rule Mutation Hooks
// ============================================

/**
 * Add a rule to a rule set
 */
export function useAddRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ruleSetId, data }: { ruleSetId: number; data: RuleInput }) => {
      const response = await api.post<{ data: SpecValidationRule }>(
        `/spec-rule-sets/${ruleSetId}/rules`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spec-rule-set', variables.ruleSetId] })
    },
  })
}

/**
 * Update a rule
 */
export function useUpdateRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ruleSetId,
      ruleId,
      data
    }: {
      ruleSetId: number
      ruleId: number
      data: Partial<RuleInput>
    }) => {
      const response = await api.put<{ data: SpecValidationRule }>(
        `/spec-rule-sets/${ruleSetId}/rules/${ruleId}`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spec-rule-set', variables.ruleSetId] })
    },
  })
}

/**
 * Delete a rule
 */
export function useDeleteRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ruleSetId, ruleId }: { ruleSetId: number; ruleId: number }) => {
      await api.delete(`/spec-rule-sets/${ruleSetId}/rules/${ruleId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spec-rule-set', variables.ruleSetId] })
    },
  })
}

/**
 * Reorder rules within a rule set
 */
export function useReorderRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ruleSetId, ruleIds }: { ruleSetId: number; ruleIds: number[] }) => {
      const response = await api.post<{ message: string; data: SpecValidationRuleSet }>(
        `/spec-rule-sets/${ruleSetId}/rules/reorder`,
        { rule_ids: ruleIds }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spec-rule-set', variables.ruleSetId] })
    },
  })
}
