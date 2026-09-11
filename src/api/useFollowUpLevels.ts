import { createCrudHooks } from './factory'

export interface FollowUpLevel {
  id: number
  name: string
  delay_days: number
  sequence: number
  send_email: boolean
  join_invoices: boolean
  message?: string | null
  is_active: boolean
  notes?: string | null
}

export interface FollowUpLevelFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateFollowUpLevelData {
  name: string
  delay_days: number
  sequence?: number
  send_email?: boolean
  join_invoices?: boolean
  message?: string | null
  is_active?: boolean
  notes?: string | null
}

export type UpdateFollowUpLevelData = Partial<CreateFollowUpLevelData>

const hooks = createCrudHooks<FollowUpLevel, FollowUpLevelFilters, CreateFollowUpLevelData, UpdateFollowUpLevelData>({
  resourceName: 'follow-up-levels',
  singularName: 'followUpLevel',
})

export const useFollowUpLevels = hooks.useList
export const useFollowUpLevel = hooks.useSingle
export const useCreateFollowUpLevel = hooks.useCreate
export const useUpdateFollowUpLevel = hooks.useUpdate
export const useDeleteFollowUpLevel = hooks.useDelete
