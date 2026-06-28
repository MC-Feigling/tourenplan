import type { DirectionsResult, GeocodeResult } from '~/shared/types/routing'
import type { OrsRoutingProfile } from '~/shared/constants/routing'
import { DEFAULT_ROUTING_PROFILE } from '~/shared/constants/routing'
import type { TourStopFormRow } from '~/composables/useToursApi'
import { addMinutesToTime, diffMinutes } from '~/shared/utils/time'

export function useRoutingApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function geocode(query: string) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<{ items: GeocodeResult[] }>('/api/routing/geocode', {
        query: { q: query },
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function directions(
    coordinates: Array<{ lat: number; lng: number }>,
    profile: OrsRoutingProfile = DEFAULT_ROUTING_PROFILE,
  ) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<{ result: DirectionsResult }>('/api/routing/directions', {
        method: 'POST',
        body: { coordinates, profile },
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, geocode, directions }
}

export function applyRouteToStops(stops: TourStopFormRow[], segments: DirectionsResult['segments']) {
  const next = stops.map((stop) => ({ ...stop }))
  for (let i = 1; i < next.length; i++) {
    const segment = segments[i - 1]
    if (segment) {
      next[i].drivingMinutesFromPrev = segment.drivingMinutes
    }
    const previous = next[i - 1]
    const arrival = addMinutesToTime(previous.plannedDeparture, next[i].drivingMinutesFromPrev)
    next[i].plannedArrival = arrival
    const dwell = Math.max(diffMinutes(next[i].plannedArrival, next[i].plannedDeparture), 5)
    next[i].plannedDeparture = addMinutesToTime(arrival, dwell)
  }
  return next
}

export function stopsWithCoordinates(stops: TourStopFormRow[]) {
  return stops.filter(
    (stop): stop is TourStopFormRow & { lat: number; lng: number } =>
      stop.lat !== null && stop.lng !== null,
  )
}

function extractError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return err.data?.statusMessage ?? err.message ?? 'Routing fehlgeschlagen'
}
