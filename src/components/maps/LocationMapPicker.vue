<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import * as turf from '@turf/turf'
import { useGeocoding, type SearchResult } from '@/composables/useGeocoding'
import { useDebounceFn } from '@vueuse/core'
import { Search, MapPin, Layers, Pencil, Trash2, LocateFixed } from 'lucide-vue-next'
import { api } from '@/api/client'

// Import leaflet-draw after Leaflet is loaded - must be done this way for Vite
// @ts-ignore - leaflet-draw extends L globally
import 'leaflet-draw'

// Fix leaflet-draw readableArea bug: "type is not defined" error
// Simplified for Indonesia (metric only: m² and hectares)
// @ts-ignore
if (L.GeometryUtil) {
  // @ts-ignore
  L.GeometryUtil.readableArea = function (area: number) {
    if (area >= 10000) {
      return (area / 10000).toFixed(2) + ' ha'
    }
    return area.toFixed(2) + ' m²'
  }
}

// Fix Leaflet marker icons for Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// Leaflet-draw event constants (defined here to avoid runtime issues)
const DRAW_CREATED = 'draw:created'
const DRAW_EDITED = 'draw:edited'
const DRAW_DELETED = 'draw:deleted'
const DRAW_DRAWSTART = 'draw:drawstart'
const DRAW_DRAWSTOP = 'draw:drawstop'
const DRAW_EDITSTART = 'draw:editstart'
const DRAW_EDITSTOP = 'draw:editstop'
const DRAW_DELETESTART = 'draw:deletestart'
const DRAW_DELETESTOP = 'draw:deletestop'

// Types
export interface LocationData {
  latitude: number | undefined
  longitude: number | undefined
  province: string
  city: string
  roofArea: number | undefined
  roofPolygon: GeoJSON.Polygon | undefined
}

export interface SolarData {
  peak_sun_hours: number
  solar_irradiance_kwh_m2_day: number
  optimal_tilt_angle: number
}

interface Props {
  modelValue: LocationData
  readonly?: boolean
  showDrawTools?: boolean
  defaultCenter?: [number, number]
  defaultZoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showDrawTools: true,
  defaultCenter: () => [-2.5, 118], // Indonesia center
  defaultZoom: 5,
})

const emit = defineEmits<{
  'update:modelValue': [value: LocationData]
  'location-selected': [coords: { lat: number; lng: number }]
  'area-calculated': [areaM2: number]
  'solar-data-loaded': [data: SolarData]
}>()

// Refs - use shallowRef for Leaflet objects to avoid reactivity issues
const mapContainer = ref<HTMLDivElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const marker = shallowRef<L.Marker | null>(null)
const drawnPolygon = shallowRef<L.Polygon | null>(null)
const drawControl = shallowRef<L.Control.Draw | null>(null)
const drawnItems = shallowRef<L.FeatureGroup | null>(null)

// State
const isSatellite = ref(false)
const searchQuery = ref('')
const showSearchResults = ref(false)
const isLoadingSolarData = ref(false)
const solarData = ref<SolarData | null>(null)
const isDrawing = ref(false) // Track if polygon drawing is active
const localRoofArea = ref<number | undefined>(undefined) // Local state for immediate UI updates
const isSelectingResult = ref(false) // Flag to prevent re-search when setting display name

// Geocoding
const { isSearching, searchResults, searchAddress, reverseGeocode, clearResults } = useGeocoding()

// Tile layers
const streetTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

let streetLayer: L.TileLayer | null = null
let satelliteLayer: L.TileLayer | null = null

// Computed - use local state OR props (local updates immediately, props syncs from parent)
const calculatedRoofArea = computed(() => localRoofArea.value ?? props.modelValue.roofArea)
const usableArea = computed(() => calculatedRoofArea.value ? Math.round(calculatedRoofArea.value * 0.8) : undefined)
const estimatedCapacity = computed(() => usableArea.value ? (usableArea.value * 0.15).toFixed(1) : undefined) // ~150W/m²
const estimatedPanels = computed(() => usableArea.value ? Math.floor(usableArea.value / 2.5) : undefined) // ~2.5m² per panel

// Search with debounce
const debouncedSearch = useDebounceFn(async (query: string) => {
  if (query.length >= 3) {
    await searchAddress(query)
    showSearchResults.value = true
  } else {
    clearResults()
    showSearchResults.value = false
  }
}, 300)

watch(searchQuery, (newVal) => {
  // Skip search if we're just setting the display name from a selection
  if (isSelectingResult.value) return
  debouncedSearch(newVal)
})

// Sync local roof area from props (for edit mode / external updates)
watch(() => props.modelValue.roofArea, (newVal) => {
  if (newVal !== undefined && localRoofArea.value === undefined) {
    localRoofArea.value = newVal
  }
}, { immediate: true })

// Watch for existing location data (for edit mode - data might load after component mounts)
watch(
  () => ({ lat: props.modelValue.latitude, lng: props.modelValue.longitude }),
  (newVal, oldVal) => {
    // Only act if we have valid new coordinates and they weren't set before
    if (newVal.lat && newVal.lng && map.value && (!oldVal?.lat || !oldVal?.lng)) {
      // Place marker and center map on existing location
      placeMarker(newVal.lat, newVal.lng)
      map.value.setView([newVal.lat, newVal.lng], 17)

      // Also draw existing polygon if available
      if (props.modelValue.roofPolygon && !drawnPolygon.value) {
        drawExistingPolygon(props.modelValue.roofPolygon)
        localRoofArea.value = props.modelValue.roofArea
      }
    }
  },
  { immediate: true }
)

// ResizeObserver to handle map container visibility changes (e.g., wizard step navigation)
let resizeObserver: ResizeObserver | null = null

// Initialize map
onMounted(() => {
  nextTick(() => {
    initializeMap()

    // Watch for container size changes (handles step navigation in wizard)
    if (mapContainer.value) {
      resizeObserver = new ResizeObserver(() => {
        if (map.value && mapContainer.value) {
          // Small delay to ensure container is fully rendered
          setTimeout(() => {
            map.value?.invalidateSize()
          }, 100)
        }
      })
      resizeObserver.observe(mapContainer.value)
    }
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (map.value) {
    map.value.remove()
  }
})

function initializeMap() {
  if (!mapContainer.value) return

  // Create map
  map.value = L.map(mapContainer.value, {
    center: props.defaultCenter,
    zoom: props.defaultZoom,
    zoomControl: false,
  })

  // Add zoom control to bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map.value)

  // Create tile layers
  streetLayer = L.tileLayer(streetTileUrl, {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  })

  satelliteLayer = L.tileLayer(satelliteTileUrl, {
    attribution: '© Esri',
    maxZoom: 19,
  })

  // Add initial layer
  streetLayer.addTo(map.value)

  // Initialize drawn items layer
  drawnItems.value = new L.FeatureGroup()
  map.value.addLayer(drawnItems.value)

  // Add draw controls if enabled
  if (props.showDrawTools && !props.readonly) {
    initializeDrawControls()
  }

  // Click handler for placing marker
  if (!props.readonly) {
    map.value.on('click', onMapClick)
  }

  // If we have existing coordinates, place marker and fetch solar data
  if (props.modelValue.latitude && props.modelValue.longitude) {
    placeMarker(props.modelValue.latitude, props.modelValue.longitude)
    map.value.setView([props.modelValue.latitude, props.modelValue.longitude], 17)

    // Fetch solar data for existing location (edit mode)
    fetchSolarData(props.modelValue.latitude, props.modelValue.longitude)
  }

  // If we have existing polygon, draw it
  if (props.modelValue.roofPolygon) {
    drawExistingPolygon(props.modelValue.roofPolygon)
    // Also set local roof area from props
    if (props.modelValue.roofArea) {
      localRoofArea.value = props.modelValue.roofArea
    }
  }
}

function initializeDrawControls() {
  if (!map.value || !drawnItems.value) return

  drawControl.value = new L.Control.Draw({
    position: 'topleft',
    draw: {
      polygon: {
        allowIntersection: false,
        showArea: true,
        shapeOptions: {
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: 0.3,
          weight: 2,
        },
      },
      polyline: false,
      circle: false,
      rectangle: false,
      marker: false,
      circlemarker: false,
    },
    edit: {
      featureGroup: drawnItems.value,
      remove: true,
    },
  })

  map.value.addControl(drawControl.value)

  // Handle draw events using string constants (more reliable than L.Draw.Event)
  map.value.on(DRAW_CREATED, (e: any) => {
    const layer = e.layer as L.Polygon

    // Remove existing polygon (only allow one roof outline)
    if (drawnPolygon.value) {
      drawnItems.value?.removeLayer(drawnPolygon.value)
    }

    drawnPolygon.value = layer
    drawnItems.value?.addLayer(layer)

    calculateAndEmitArea(layer)
  })

  map.value.on(DRAW_EDITED, () => {
    if (drawnPolygon.value) {
      calculateAndEmitArea(drawnPolygon.value)
    }
  })

  map.value.on(DRAW_DELETED, () => {
    drawnPolygon.value = null
    localRoofArea.value = undefined // Clear local state
    updateModelValue({
      roofArea: undefined,
      roofPolygon: undefined,
    })
    emit('area-calculated', 0)
  })

  // Track drawing state to prevent marker placement while drawing
  map.value.on(DRAW_DRAWSTART, () => {
    isDrawing.value = true
  })

  map.value.on(DRAW_DRAWSTOP, () => {
    isDrawing.value = false
  })

  map.value.on(DRAW_EDITSTART, () => {
    isDrawing.value = true
  })

  map.value.on(DRAW_EDITSTOP, () => {
    isDrawing.value = false
  })

  map.value.on(DRAW_DELETESTART, () => {
    isDrawing.value = true
  })

  map.value.on(DRAW_DELETESTOP, () => {
    isDrawing.value = false
  })
}

function onMapClick(e: L.LeafletMouseEvent) {
  // Don't place marker while drawing polygon
  if (isDrawing.value) return

  placeMarker(e.latlng.lat, e.latlng.lng)
  fetchLocationDetails(e.latlng.lat, e.latlng.lng)
}

function placeMarker(lat: number, lng: number) {
  if (!map.value) return

  if (marker.value) {
    marker.value.setLatLng([lat, lng])
  } else {
    marker.value = L.marker([lat, lng], {
      draggable: !props.readonly,
    }).addTo(map.value)

    if (!props.readonly) {
      marker.value.on('dragend', () => {
        const pos = marker.value?.getLatLng()
        if (pos) {
          fetchLocationDetails(pos.lat, pos.lng)
        }
      })
    }
  }

  emit('location-selected', { lat, lng })
}

async function fetchLocationDetails(lat: number, lng: number) {
  // Update coordinates immediately
  updateModelValue({
    latitude: lat,
    longitude: lng,
  })

  // Reverse geocode to get city/province
  const result = await reverseGeocode(lat, lng)
  if (result && (result.city || result.province)) {
    updateModelValue({
      city: result.city || undefined,
      province: result.province || undefined,
    })
  }

  // Fetch solar data from our backend (this also provides city/province as fallback)
  await fetchSolarData(lat, lng)
}

async function fetchSolarData(lat: number, lng: number) {
  isLoadingSolarData.value = true
  try {
    // Use existing solar data lookup endpoint with coordinates (via authenticated API client)
    const response = await api.get('/solar-data/lookup', {
      params: { latitude: lat, longitude: lng },
    })

    const data = response.data.data
    if (!data) {
      console.warn('Solar data lookup returned empty data')
      return
    }

    solarData.value = {
      peak_sun_hours: data.peak_sun_hours,
      solar_irradiance_kwh_m2_day: data.solar_irradiance_kwh_m2_day,
      optimal_tilt_angle: data.optimal_tilt_angle,
    }
    emit('solar-data-loaded', solarData.value)

    // Update city/province from solar data (our database has accurate Indonesian locations)
    if (data.city && data.province) {
      console.log('Setting location from solar data:', data.city, data.province)
      updateModelValue({
        city: data.city,
        province: data.province,
      })
    }
  } catch (error) {
    console.error('Failed to fetch solar data:', error)
  } finally {
    isLoadingSolarData.value = false
  }
}

function calculateAndEmitArea(polygon: L.Polygon) {
  const latlngs = polygon.getLatLngs()[0] as L.LatLng[]
  const coords: [number, number][] = latlngs.map(p => [p.lng, p.lat])
  const firstCoord = coords[0]
  if (firstCoord) {
    coords.push(firstCoord) // Close polygon
  }

  const turfPolygon = turf.polygon([coords])
  const areaM2 = Math.round(turf.area(turfPolygon))

  // Update local state immediately for responsive UI
  localRoofArea.value = areaM2

  // Convert to GeoJSON for storage
  const geoJson: GeoJSON.Polygon = {
    type: 'Polygon',
    coordinates: [coords],
  }

  updateModelValue({
    roofArea: areaM2,
    roofPolygon: geoJson,
  })

  emit('area-calculated', areaM2)
}

function drawExistingPolygon(geoJson: GeoJSON.Polygon) {
  if (!map.value || !drawnItems.value) return

  const rawCoords = geoJson.coordinates[0] as [number, number][]
  const coords = rawCoords.map(c => [c[1], c[0]] as L.LatLngTuple)
  const polygon = L.polygon(coords, {
    color: '#f97316',
    fillColor: '#f97316',
    fillOpacity: 0.3,
    weight: 2,
  })

  drawnPolygon.value = polygon
  drawnItems.value.addLayer(polygon)
}

function toggleMapType() {
  if (!map.value) return

  isSatellite.value = !isSatellite.value

  if (isSatellite.value) {
    streetLayer?.remove()
    satelliteLayer?.addTo(map.value)
  } else {
    satelliteLayer?.remove()
    streetLayer?.addTo(map.value)
  }
}

function selectSearchResult(result: SearchResult) {
  if (!map.value) return

  placeMarker(result.lat, result.lng)
  map.value.setView([result.lat, result.lng], 17)

  // Update location data (only set city/province if they have values)
  updateModelValue({
    latitude: result.lat,
    longitude: result.lng,
    city: result.city || undefined,
    province: result.province || undefined,
  })

  // Clear search and set display name (without triggering a new search)
  isSelectingResult.value = true
  searchQuery.value = result.displayName.split(',')[0] ?? ''
  showSearchResults.value = false
  clearResults()
  // Reset flag after Vue processes the change
  nextTick(() => {
    isSelectingResult.value = false
  })

  // Fetch solar data (this also provides city/province from our database as fallback)
  fetchSolarData(result.lat, result.lng)
}

function goToMyLocation() {
  if (!map.value) return

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map.value?.setView([latitude, longitude], 17)
        placeMarker(latitude, longitude)
        fetchLocationDetails(latitude, longitude)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Could not get your location. Please enable location services.')
      }
    )
  }
}

function clearPolygon() {
  if (drawnPolygon.value && drawnItems.value) {
    drawnItems.value.removeLayer(drawnPolygon.value)
    drawnPolygon.value = null
    updateModelValue({
      roofArea: undefined,
      roofPolygon: undefined,
    })
  }
}

function updateModelValue(updates: Partial<LocationData>) {
  emit('update:modelValue', {
    ...props.modelValue,
    ...updates,
  })
}

// Close search results when clicking outside
function onClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.search-container')) {
    showSearchResults.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <div class="location-map-picker">
    <!-- Header with Search and Layer Toggle -->
    <div class="flex items-center gap-3 mb-3">
      <!-- Search Box -->
      <div class="search-container relative flex-1">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search address..."
            class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            :disabled="readonly"
          />
          <div
            v-if="isSearching"
            class="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
          </div>
        </div>

        <!-- Search Results Dropdown -->
        <div
          v-if="showSearchResults && searchResults.length > 0"
          class="absolute z-[1000] w-full mt-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg max-h-60 overflow-auto"
        >
          <button
            v-for="result in searchResults"
            :key="`${result.lat}-${result.lng}`"
            type="button"
            class="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0"
            @click="selectSearchResult(result)"
          >
            <div class="flex items-start gap-2">
              <MapPin class="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 shrink-0" />
              <div class="min-w-0">
                <div class="text-sm text-slate-900 dark:text-slate-100 truncate">{{ result.displayName }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">{{ result.city }}, {{ result.province }}</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Layer Toggle -->
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        @click="toggleMapType"
      >
        <Layers class="w-4 h-4" />
        <span>{{ isSatellite ? 'Street' : 'Satellite' }}</span>
      </button>

      <!-- My Location -->
      <button
        type="button"
        class="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        title="Go to my location"
        @click="goToMyLocation"
      >
        <LocateFixed class="w-4 h-4" />
      </button>
    </div>

    <!-- Map Container -->
    <div
      ref="mapContainer"
      class="w-full h-[400px] rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
    />

    <!-- Info Panels -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <!-- Coordinates & Location -->
      <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <div class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
          <MapPin class="w-4 h-4" />
          Coordinates
        </div>

        <div v-if="modelValue.latitude && modelValue.longitude" class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Latitude</span>
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ modelValue.latitude.toFixed(6) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">Longitude</span>
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ modelValue.longitude.toFixed(6) }}</span>
          </div>
          <div v-if="modelValue.province" class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <span class="text-slate-500 dark:text-slate-400">Province</span>
            <span class="text-slate-900 dark:text-slate-100">{{ modelValue.province }}</span>
          </div>
          <div v-if="modelValue.city" class="flex justify-between">
            <span class="text-slate-500 dark:text-slate-400">City</span>
            <span class="text-slate-900 dark:text-slate-100">{{ modelValue.city }}</span>
          </div>
        </div>

        <div v-else class="text-sm text-slate-500 dark:text-slate-400">
          Click on the map to select a location
        </div>
      </div>

      <!-- Solar Data -->
      <div class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
        <div class="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400 mb-3">
          <span>☀️</span>
          Solar Data
        </div>

        <div v-if="isLoadingSolarData" class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent" />
          Loading solar data...
        </div>

        <div v-else-if="solarData" class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-600 dark:text-slate-400">Peak Sun Hours</span>
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ solarData.peak_sun_hours }} h/day</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600 dark:text-slate-400">Irradiance</span>
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ solarData.solar_irradiance_kwh_m2_day }} kWh/m²/day</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600 dark:text-slate-400">Optimal Tilt</span>
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ solarData.optimal_tilt_angle }}°</span>
          </div>
        </div>

        <div v-else class="text-sm text-slate-500 dark:text-slate-400">
          Select a location to see solar data
        </div>
      </div>
    </div>

    <!-- Roof Area Panel -->
    <div v-if="showDrawTools" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mt-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
          <Pencil class="w-4 h-4" />
          Roof Area
        </div>
        <button
          v-if="drawnPolygon"
          type="button"
          class="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
          @click="clearPolygon"
        >
          <Trash2 class="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      <div v-if="calculatedRoofArea" class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-slate-600 dark:text-slate-400">Drawn Area</span>
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ calculatedRoofArea.toLocaleString() }} m²</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600 dark:text-slate-400">Usable Area (80%)</span>
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ usableArea?.toLocaleString() }} m²</span>
        </div>
        <div class="flex justify-between pt-2 border-t border-green-200 dark:border-green-800">
          <span class="text-slate-600 dark:text-slate-400">Est. Capacity</span>
          <span class="font-bold text-green-700 dark:text-green-400">{{ estimatedCapacity }} kWp</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600 dark:text-slate-400">Est. Panels</span>
          <span class="font-medium text-slate-900 dark:text-slate-100">~{{ estimatedPanels }} panels</span>
        </div>
      </div>

      <div v-else class="text-sm text-slate-500 dark:text-slate-400">
        <p>Use the polygon tool on the map to draw your roof outline.</p>
        <p class="mt-1 text-xs">Switch to Satellite view for better accuracy.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Override Leaflet draw toolbar styles for better integration */
:deep(.leaflet-draw-toolbar a) {
  background-color: white;
  border-radius: 4px;
}

:deep(.leaflet-draw-toolbar a:hover) {
  background-color: #f1f5f9;
}
</style>
