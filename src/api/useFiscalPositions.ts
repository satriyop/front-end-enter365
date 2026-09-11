import { createCrudHooks } from './factory'

export interface FiscalPositionTaxMap {
  id?: number
  source_tax_record_id: number
  dest_tax_record_id: number | null
  source_tax?: { id: number; code: string; name: string; rate: number } | null
  dest_tax?: { id: number; code: string; name: string; rate: number } | null
}

export interface FiscalPositionAccountMap {
  id?: number
  source_account_id: number
  dest_account_id: number
  source_account?: { id: number; code: string; name: string } | null
  dest_account?: { id: number; code: string; name: string } | null
}

export interface FiscalPosition {
  id: number
  code: string
  name: string
  notes?: string | null
  is_active: boolean
  tax_maps: FiscalPositionTaxMap[]
  account_maps: FiscalPositionAccountMap[]
}

export interface FiscalPositionFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateFiscalPositionData {
  code: string
  name: string
  notes?: string | null
  is_active?: boolean
  tax_maps?: Array<{
    source_tax_record_id: number
    dest_tax_record_id: number | null
  }>
  account_maps?: Array<{
    source_account_id: number
    dest_account_id: number
  }>
}

export type UpdateFiscalPositionData = Partial<CreateFiscalPositionData>

const hooks = createCrudHooks<FiscalPosition, FiscalPositionFilters, CreateFiscalPositionData, UpdateFiscalPositionData>({
  resourceName: 'fiscal-positions',
  lookupParams: { is_active: true, per_page: 200 },
})

export const useFiscalPositions = hooks.useList
export const useFiscalPosition = hooks.useSingle
export const useCreateFiscalPosition = hooks.useCreate
export const useUpdateFiscalPosition = hooks.useUpdate
export const useDeleteFiscalPosition = hooks.useDelete
export const useFiscalPositionsLookup = hooks.useLookup
