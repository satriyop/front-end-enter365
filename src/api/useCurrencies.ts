import { createCrudHooks } from './factory'

export interface Currency {
  id: number
  code: string
  name: string
  symbol: string
  decimal_places: number
  is_base_currency: boolean
  is_active: boolean
}

export interface CurrencyFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateCurrencyData {
  code: string
  name: string
  symbol: string
  decimal_places?: number
  is_base_currency?: boolean
  is_active?: boolean
}

export type UpdateCurrencyData = Partial<CreateCurrencyData>

const hooks = createCrudHooks<Currency, CurrencyFilters, CreateCurrencyData, UpdateCurrencyData>({
  resourceName: 'currencies',
  singularName: 'currency',
})

export const useCurrencies = hooks.useList
export const useCurrency = hooks.useSingle
export const useCreateCurrency = hooks.useCreate
export const useUpdateCurrency = hooks.useUpdate
export const useDeleteCurrency = hooks.useDelete
export const useCurrenciesLookup = hooks.useLookup
