export const ORS_BASE_URL = 'https://api.openrouteservice.org'

export const ORS_ROUTING_PROFILES = ['driving-hgv', 'driving-car'] as const
export type OrsRoutingProfile = (typeof ORS_ROUTING_PROFILES)[number]

export const DEFAULT_ROUTING_PROFILE: OrsRoutingProfile = 'driving-hgv'

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

export const GEOCODE_RESULT_LIMIT = 5

export const MIN_QUERY_LENGTH = 3
