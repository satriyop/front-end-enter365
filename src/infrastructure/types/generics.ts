/**
 * Generic Type Utilities
 *
 * Reusable type definitions for common patterns.
 */

/**
 * Make specific keys required in a type
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Make specific keys optional in a type
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Entity with ID (typically after creation)
 */
export type WithId<T> = T & { id: number }

/**
 * Entity with timestamps (from database)
 */
export interface WithTimestamps {
  created_at: string
  updated_at: string
}

/**
 * Entity with soft delete
 */
export interface WithSoftDelete {
  deleted_at: string | null
}

/**
 * Paginated response wrapper (matches Laravel pagination)
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
  }
  links?: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

/**
 * Simple list response (non-paginated)
 */
export interface ListResponse<T> {
  data: T[]
}

/**
 * Single item response
 */
export interface SingleResponse<T> {
  data: T
}

/**
 * API mutation result
 */
export interface MutationResult<T> {
  data: T
  message?: string
}

/**
 * Base filter params with pagination
 */
export interface PaginatedFilters {
  page?: number
  per_page?: number
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * Document types in the system
 */
export type DocumentType =
  | 'quotation'
  | 'invoice'
  | 'bill'
  | 'purchase_order'
  | 'delivery_order'
  | 'goods_receipt_note'
  | 'work_order'
  | 'journal_entry'
  | 'payment'

/**
 * Common document statuses
 */
export type DocumentStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'void'

/**
 * Lookup item (for dropdowns)
 */
export interface LookupItem {
  value: number
  label: string
}

/**
 * Select option
 */
export interface SelectOption<T = string> {
  value: T
  label: string
  disabled?: boolean
}

/**
 * Deep partial - makes all nested properties optional
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null

/**
 * Maybe type helper (nullable or undefined)
 */
export type Maybe<T> = T | null | undefined

/**
 * Async function type
 */
export type AsyncFunction<T = void> = () => Promise<T>

/**
 * Callback function type
 */
export type Callback<T = void> = () => T
