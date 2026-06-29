export const ORS_API_BASE_URL = 'https://api.heigit.org'

export const ORS_ROUTING_BASE_URL = `${ORS_API_BASE_URL}/openrouteservice`

export const ORS_GEOCODE_BASE_URL = `${ORS_API_BASE_URL}/pelias/v1`

/** @deprecated Use ORS_ROUTING_BASE_URL or ORS_GEOCODE_BASE_URL */
export const ORS_BASE_URL = ORS_API_BASE_URL

export const ORS_PLACEHOLDER_API_KEYS = ['your-openrouteservice-api-key'] as const

export const ORS_ROUTING_PROFILES = ['driving-hgv', 'driving-car'] as const
export type OrsRoutingProfile = (typeof ORS_ROUTING_PROFILES)[number]

export const DEFAULT_ROUTING_PROFILE: OrsRoutingProfile = 'driving-hgv'

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

export const GEOCODE_RESULT_LIMIT = 5

export const MIN_QUERY_LENGTH = 3
