export type GeocodeResult = {
  label: string
  name: string
  address: string
  lat: number
  lng: number
}

export type RouteSegment = {
  drivingMinutes: number
  distanceKm: number
}

export type DirectionsResult = {
  profile: string
  totalDrivingMinutes: number
  totalDistanceKm: number
  segments: RouteSegment[]
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}
