import { useQuery } from '@tanstack/vue-query'
import { api } from './client'

export interface GlobalSearchResult {
  id: number
  type: 'quotation' | 'invoice' | 'contact' | 'product' | 'bom' | 'project' | 'solar_proposal'
  title: string
  subtitle?: string
  path: string
}

export interface GlobalSearchResponse {
  data: GlobalSearchResult[]
  meta?: {
    total: number
    query: string
  }
}

/**
 * Global search across all entities
 * Falls back to client-side search if backend doesn't support it
 */
export function useGlobalSearch(query: Ref<string>) {
  return useQuery({
    queryKey: ['global-search', query],
    queryFn: async (): Promise<GlobalSearchResult[]> => {
      if (!query.value || query.value.length < 2) {
        return []
      }

      try {
        // Try the global search endpoint first
        const response = await api.get<GlobalSearchResponse>('/search', {
          params: { q: query.value, limit: 15 }
        })
        return response.data.data
      } catch (error) {
        // If endpoint doesn't exist, fall back to searching individual endpoints
        return fallbackSearch(query.value)
      }
    },
    enabled: () => query.value.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  })
}

/**
 * Fallback: search individual endpoints if global search not available
 */
async function fallbackSearch(query: string): Promise<GlobalSearchResult[]> {
  const results: GlobalSearchResult[] = []
  const searchPromises: Promise<void>[] = []

  // Search quotations
  searchPromises.push(
    api.get('/quotations', { params: { search: query, limit: 5 } })
      .then(res => {
        const items = res.data.data || []
        items.forEach((item: { id: number; quotation_number: string; contact?: { name: string } }) => {
          results.push({
            id: item.id,
            type: 'quotation',
            title: item.quotation_number,
            subtitle: item.contact?.name,
            path: `/quotations/${item.id}`,
          })
        })
      })
      .catch(() => {})
  )

  // Search invoices
  searchPromises.push(
    api.get('/invoices', { params: { search: query, limit: 5 } })
      .then(res => {
        const items = res.data.data || []
        items.forEach((item: { id: number; invoice_number: string; contact?: { name: string } }) => {
          results.push({
            id: item.id,
            type: 'invoice',
            title: item.invoice_number,
            subtitle: item.contact?.name,
            path: `/invoices/${item.id}`,
          })
        })
      })
      .catch(() => {})
  )

  // Search contacts
  searchPromises.push(
    api.get('/contacts', { params: { search: query, limit: 5 } })
      .then(res => {
        const items = res.data.data || []
        items.forEach((item: { id: number; name: string; company?: string }) => {
          results.push({
            id: item.id,
            type: 'contact',
            title: item.name,
            subtitle: item.company,
            path: `/contacts/${item.id}`,
          })
        })
      })
      .catch(() => {})
  )

  // Search products
  searchPromises.push(
    api.get('/products', { params: { search: query, limit: 5 } })
      .then(res => {
        const items = res.data.data || []
        items.forEach((item: { id: number; name: string; sku?: string }) => {
          results.push({
            id: item.id,
            type: 'product',
            title: item.name,
            subtitle: item.sku,
            path: `/products/${item.id}`,
          })
        })
      })
      .catch(() => {})
  )

  // Search BOMs
  searchPromises.push(
    api.get('/boms', { params: { search: query, limit: 5 } })
      .then(res => {
        const items = res.data.data || []
        items.forEach((item: { id: number; bom_number: string; name?: string }) => {
          results.push({
            id: item.id,
            type: 'bom',
            title: item.bom_number,
            subtitle: item.name,
            path: `/boms/${item.id}`,
          })
        })
      })
      .catch(() => {})
  )

  await Promise.all(searchPromises)

  // Sort by relevance (exact matches first)
  const lowerQuery = query.toLowerCase()
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase().includes(lowerQuery) ? 0 : 1
    const bExact = b.title.toLowerCase().includes(lowerQuery) ? 0 : 1
    return aExact - bExact
  })

  return results.slice(0, 15)
}

// Import Ref type
import type { Ref } from 'vue'
