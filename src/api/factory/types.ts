/**
 * Configuration for creating CRUD hooks
 */
export interface CrudHooksConfig {
  /** Resource name for query keys (plural, e.g., 'contacts') */
  resourceName: string
  /** API endpoint (defaults to `/${resourceName}`) */
  endpoint?: string
  /** Singular form for single-item query keys (e.g., 'contact') */
  singularName?: string
  /** Stale time for lookup queries in ms (default: 5 minutes) */
  lookupStaleTime?: number
  /** Default lookup params */
  lookupParams?: Record<string, unknown>
}

/**
 * Base filter interface that all filter types should extend
 */
export interface BaseFilters {
  page?: number
  per_page?: number
  search?: string
}
