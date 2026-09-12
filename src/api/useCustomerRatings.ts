import { createCrudHooks } from './factory'

export interface CustomerRating {
  id: number
  project_id: number
  project?: { id: number; project_number: string; name: string } | null
  rateable_type?: string | null
  rateable_id?: number | null
  rateable?: { id: number; type: string; title?: string; name?: string } | null
  contact_id?: number | null
  contact?: { id: number; name: string } | null
  rating: number
  comment?: string | null
  rated_at?: string | null
  created_by?: number | null
  creator?: { id: number; name: string } | null
}

export interface CustomerRatingFilters {
  page?: number
  per_page?: number
  project_id?: number
  rating?: number
  search?: string
}

export interface CreateCustomerRatingData {
  project_id: number
  rateable_type?: 'task' | 'project' | null
  rateable_id?: number | null
  contact_id?: number | null
  rating: number
  comment?: string | null
  rated_at?: string | null
}

export type UpdateCustomerRatingData = Partial<CreateCustomerRatingData>

const hooks = createCrudHooks<CustomerRating, CustomerRatingFilters, CreateCustomerRatingData, UpdateCustomerRatingData>({
  resourceName: 'customer-ratings',
  singularName: 'customerRating',
})

export const useCustomerRatings = hooks.useList
export const useCustomerRating = hooks.useSingle
export const useCreateCustomerRating = hooks.useCreate
export const useUpdateCustomerRating = hooks.useUpdate
export const useDeleteCustomerRating = hooks.useDelete
