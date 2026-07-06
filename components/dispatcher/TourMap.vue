<script setup lang="ts">
import type { TourStopFormRow } from '~/composables/useToursApi'
import type { GeocodeResult } from '~/shared/types/routing'
import { MAP_STYLE_URL } from '~/shared/constants/routing'

const props = defineProps<{
  stops: TourStopFormRow[]
  routeCoordinates?: [number, number][]
}>()

const mapContainer = ref<HTMLDivElement | null>(null)
let map: import('maplibre-gl').Map | null = null
let maplibre: typeof import('maplibre-gl') | null = null
const markers: import('maplibre-gl').Marker[] = []

const ROUTE_SOURCE_ID = 'tour-route'
const ROUTE_LAYER_ID = 'tour-route-line'

const geoStops = computed(() =>
  props.stops
    .map((stop, index) => ({ stop, index }))
    .filter(({ stop }) => stop.lat !== null && stop.lng !== null),
)

async function initMap() {
  if (!mapContainer.value || map) return
  maplibre = await import('maplibre-gl')
  await import('maplibre-gl/dist/maplibre-gl.css')
  map = new maplibre.Map({
    container: mapContainer.value,
    style: MAP_STYLE_URL,
    center: [10.4515, 51.1657],
    zoom: 5.5,
  })
  map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right')
  map.on('load', () => {
    refreshMap()
  })
}

function clearMarkers() {
  markers.forEach((marker) => marker.remove())
  markers.length = 0
}

function refreshMap() {
  if (!map || !maplibre || !map.isStyleLoaded()) return

  clearMarkers()
  for (const { stop, index } of geoStops.value) {
    const el = document.createElement('div')
    el.className =
      'flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-slate-900 ring-2 ring-white shadow-lg'
    el.textContent = String(index + 1)
    const marker = new maplibre.Marker({ element: el })
      .setLngLat([stop.lng!, stop.lat!])
      .addTo(map)
    markers.push(marker)
  }

  const coords = props.routeCoordinates ?? []
  const lineData = {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: coords.length >= 2 ? coords : [],
    },
    properties: {},
  }

  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: lineData })
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      paint: {
        'line-color': '#f59e0b',
        'line-width': 4,
        'line-opacity': 0.9,
      },
    })
  } else {
    const source = map.getSource(ROUTE_SOURCE_ID) as import('maplibre-gl').GeoJSONSource
    source.setData(lineData)
  }

  fitBounds(coords.length >= 2 ? coords : undefined)
}

function fitBounds(routeCoords?: [number, number][]) {
  if (!map || !maplibre) return

  const points =
    routeCoords ??
    geoStops.value.map(({ stop }) => [stop.lng!, stop.lat!] as [number, number])

  if (points.length === 0) return
  if (points.length === 1) {
    const center = points[0]!
    map.setCenter(center)
    map.setZoom(12)
    return
  }

  const bounds = new maplibre.LngLatBounds(points[0], points[0])
  for (const point of points) bounds.extend(point)
  map.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 500 })
}

watch(
  () => [props.stops, props.routeCoordinates],
  () => refreshMap(),
  { deep: true },
)

onMounted(() => {
  void initMap()
})

onBeforeUnmount(() => {
  clearMarkers()
  map?.remove()
  map = null
})
</script>

<template>
  <div class="space-y-2">
    <div
      ref="mapContainer"
      class="h-56 w-full overflow-hidden rounded-xl border border-white/10 bg-slate-800 sm:h-72"
      role="img"
      aria-label="Routenkarte"
    />
    <p v-if="geoStops.length === 0" class="text-xs text-slate-500">
      Adressen suchen, um Stopps auf der Karte zu sehen.
    </p>
    <p v-else class="text-xs text-slate-400">
      {{ geoStops.length }} von {{ stops.length }} Stopps geocodiert
    </p>
  </div>
</template>
