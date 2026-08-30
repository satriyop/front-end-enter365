/**
 * Electrical panel add-on hooks for BOM templates (brand coverage / resolve).
 * Core BOM template CRUD lives in @/api/useBomTemplates.
 */

import { computed, type ComputedRef, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api, type ApiResponse } from '@/api/client'
import type { paths } from '@/api/types'

export type AvailableBrand = ApiResponse<
  paths['/bom-templates/{bomTemplate}/available-brands']['get']
>[number]

/**
 * Brands available for resolving a template's standard-based lines.
 * Route is gated by feature:electrical_panel on the API.
 */
export function useTemplateAvailableBrands(
  id: Ref<number | string | null | undefined> | ComputedRef<number | string | null | undefined>,
  enabled: Ref<boolean> | ComputedRef<boolean> | boolean = true,
) {
  return useQuery({
    queryKey: computed(() => ['bom-template', id.value, 'brands']),
    queryFn: async () => {
      const response = await api.get<{ data: AvailableBrand[]; meta: Record<string, unknown> }>(
        `/bom-templates/${id.value}/available-brands`,
      )
      return response.data.data
    },
    enabled: computed(() => {
      const flag = typeof enabled === 'boolean' ? enabled : enabled.value
      return flag && !!id.value
    }),
    staleTime: 30 * 1000,
  })
}
