import { ref } from 'vue'

export interface NominatimResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  boundingbox: [string, string, string, string]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
  error?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    country?: string
    country_code?: string
  }
}

export interface SearchResult {
  lat: number
  lng: number
  displayName: string
  city: string
  province: string
}

export function useGeocoding() {
  const isSearching = ref(false)
  const searchResults = ref<SearchResult[]>([])
  const searchError = ref<string | null>(null)

  /**
   * Search for addresses using Nominatim (OpenStreetMap)
   * Free, no API key required
   * Rate limit: 1 request per second
   */
  async function searchAddress(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 3) {
      searchResults.value = []
      return []
    }

    isSearching.value = true
    searchError.value = null

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `countrycodes=id&` + // Indonesia only
        `limit=5&` +
        `addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id,en', // Prefer Indonesian names
          }
        }
      )

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data: NominatimResult[] = await response.json()

      searchResults.value = data.map(item => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: extractCity(item),
        province: extractProvince(item),
      }))

      return searchResults.value
    } catch (error) {
      searchError.value = error instanceof Error ? error.message : 'Search failed'
      searchResults.value = []
      return []
    } finally {
      isSearching.value = false
    }
  }

  /**
   * Reverse geocode coordinates to get address details
   */
  async function reverseGeocode(lat: number, lng: number): Promise<SearchResult | null> {
    isSearching.value = true
    searchError.value = null

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${lat}&` +
        `lon=${lng}&` +
        `format=json&` +
        `addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id,en',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }

      const data: NominatimResult = await response.json()

      if (data.error) {
        return null
      }

      return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        displayName: data.display_name,
        city: extractCity(data),
        province: extractProvince(data),
      }
    } catch (error) {
      searchError.value = error instanceof Error ? error.message : 'Reverse geocoding failed'
      return null
    } finally {
      isSearching.value = false
    }
  }

  /**
   * Extract city name from Nominatim result
   */
  function extractCity(result: NominatimResult): string {
    const addr = result.address
    if (!addr) return ''

    // Try different address fields in order of preference
    return addr.city || addr.town || addr.municipality || addr.village || addr.county || ''
  }

  /**
   * Extract province/state from Nominatim result
   */
  function extractProvince(result: NominatimResult): string {
    const addr = result.address
    if (!addr) return ''

    return addr.state || ''
  }

  function clearResults() {
    searchResults.value = []
    searchError.value = null
  }

  return {
    isSearching,
    searchResults,
    searchError,
    searchAddress,
    reverseGeocode,
    clearResults,
  }
}
