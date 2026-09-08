import { createCrudHooks } from './factory'

export type TaxTagApplicability = 'base' | 'tax'

export interface TaxTag {
  id: number
  code: string
  name: string
  applicability: TaxTagApplicability
  is_active: boolean
}

export interface TaxTagFilters {
  page?: number
  per_page?: number
  search?: string
  applicability?: TaxTagApplicability | ''
  is_active?: boolean
}

export interface CreateTaxTagData {
  code: string
  name: string
  applicability?: TaxTagApplicability
  is_active?: boolean
}

export type UpdateTaxTagData = Partial<CreateTaxTagData>

const hooks = createCrudHooks<TaxTag, TaxTagFilters, CreateTaxTagData, UpdateTaxTagData>({
  resourceName: 'tax-tags',
  singularName: 'tax-tag',
  lookupParams: { is_active: true, per_page: 200 },
})

export const useTaxTags = hooks.useList
export const useTaxTag = hooks.useSingle
export const useCreateTaxTag = hooks.useCreate
export const useUpdateTaxTag = hooks.useUpdate
export const useTaxTagsLookup = hooks.useLookup

export const TAX_TAG_APPLICABILITY_OPTIONS = [
  { value: 'base', label: 'Base' },
  { value: 'tax', label: 'Tax' },
] as const

export function taxTagApplicabilityLabel(value: string): string {
  return TAX_TAG_APPLICABILITY_OPTIONS.find((option) => option.value === value)?.label ?? value
}

export function taxTagIdsFromTagId(
  id: string | number | null | undefined,
): number[] | null {
  if (id === null || id === undefined || id === '') {
    return null
  }
  const parsed = Number(id)
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null
  }
  return [parsed]
}

export function taxTagIdsPrimaryId(value: number[] | null | undefined): string {
  if (!value || value.length === 0) {
    return ''
  }
  return String(value[0])
}

export function formatTaxTagLabel(
  value: number[] | null | undefined,
  tags: TaxTag[] | undefined,
): string {
  if (!value || value.length === 0) {
    return ''
  }

  return value
    .map((id) => {
      const tag = tags?.find((row) => row.id === id)
      return tag ? `${tag.code} ${tag.name}` : String(id)
    })
    .join(', ')
}
