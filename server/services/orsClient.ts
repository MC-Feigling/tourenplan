import type { GeocodeResult, DirectionsResult, RouteSegment } from '../../shared/types/routing'
import {
  DEFAULT_ROUTING_PROFILE,
  GEOCODE_RESULT_LIMIT,
  ORS_BASE_URL,
} from '../../shared/constants/routing'
import type { OrsRoutingProfile } from '../../shared/constants/routing'
import type { DirectionsCoordinate } from '../../shared/schemas/routing'

function getOrsApiKey(): string {
  const config = useRuntimeConfig()
  const key = config.orsApiKey as string
  if (!key?.trim()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'ORS API key not configured (NUXT_ORS_API_KEY)',
    })
  }
  return key.trim()
}

type OrsGeocodeFeature = {
  properties?: {
    label?: string
    name?: string
    country?: string
    region?: string
    locality?: string
    street?: string
    housenumber?: string
    postalcode?: string
  }
  geometry?: {
    coordinates?: [number, number]
  }
}

type OrsDirectionsResponse = {
  features?: Array<{
    geometry?: {
      type?: string
      coordinates?: [number, number][]
    }
    properties?: {
      segments?: Array<{
        distance?: number
        duration?: number
      }>
      summary?: {
        distance?: number
        duration?: number
      }
    }
  }>
}

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const apiKey = getOrsApiKey()
  const url = new URL(`${ORS_BASE_URL}/geocode/search`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('text', query)
  url.searchParams.set('size', String(GEOCODE_RESULT_LIMIT))
  url.searchParams.set('boundary.country', 'DE')

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Geocoding failed (${response.status})`,
    })
  }

  const data = (await response.json()) as { features?: OrsGeocodeFeature[] }
  const features = data.features ?? []

  return features
    .map((feature): GeocodeResult | null => {
      const coords = feature.geometry?.coordinates
      if (!coords || coords.length < 2) return null
      const [lng, lat] = coords
      const props = feature.properties ?? {}
      const label = props.label ?? props.name ?? query
      const address =
        props.label ??
        [props.street, props.housenumber, props.postalcode, props.locality]
          .filter(Boolean)
          .join(' ')
          .trim()

      return {
        label,
        name: props.name ?? label,
        address: address || label,
        lat,
        lng,
      }
    })
    .filter((item): item is GeocodeResult => item !== null)
}

export async function fetchDirections(
  coordinates: DirectionsCoordinate[],
  profile: OrsRoutingProfile = DEFAULT_ROUTING_PROFILE,
): Promise<DirectionsResult> {
  const apiKey = getOrsApiKey()
  const url = `${ORS_BASE_URL}/v2/directions/${profile}/geojson`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify({
      coordinates: coordinates.map((c) => [c.lng, c.lat]),
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw createError({
      statusCode: response.status,
      statusMessage: text || `Routing failed (${response.status})`,
    })
  }

  const data = (await response.json()) as OrsDirectionsResponse
  const feature = data.features?.[0]
  if (!feature?.geometry?.coordinates?.length) {
    throw createError({ statusCode: 422, statusMessage: 'No route found' })
  }

  const rawSegments = feature.properties?.segments ?? []
  const segments: RouteSegment[] = rawSegments.map((segment) => ({
    drivingMinutes: Math.max(1, Math.round((segment.duration ?? 0) / 60)),
    distanceKm: Math.round(((segment.distance ?? 0) / 1000) * 10) / 10,
  }))

  const summary = feature.properties?.summary
  const totalDrivingMinutes = Math.max(
    1,
    Math.round((summary?.duration ?? segments.reduce((s, x) => s + x.drivingMinutes * 60, 0)) / 60),
  )
  const totalDistanceKm =
    Math.round(
      ((summary?.distance ?? segments.reduce((s, x) => s + x.distanceKm * 1000, 0)) / 1000) * 10,
    ) / 10

  return {
    profile,
    totalDrivingMinutes,
    totalDistanceKm,
    segments,
    geometry: {
      type: 'LineString',
      coordinates: feature.geometry.coordinates,
    },
  }
}
