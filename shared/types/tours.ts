import type { ComplianceProfile } from '../constants/compliance'
import type { StopType, TourStatus, TourType } from '../constants/tours'

export type PublicTourStop = {
  id: string
  tourId: string
  sequence: number
  locationName: string
  address: string
  lat: number | null
  lng: number | null
  plannedArrival: string
  plannedDeparture: string
  stopType: StopType
  drivingMinutesFromPrev: number
}

export type PublicTour = {
  id: string
  depotId: string | null
  type: TourType
  name: string
  date: string
  status: TourStatus
  complianceProfile: ComplianceProfile
  lineLengthKm: number | null
  lineTemplateId: string | null
  vehicleId: string | null
  driverId: string | null
  notes: string
  totalDrivingMinutes: number
  stops: PublicTourStop[]
  createdAt: number
  updatedAt: number
}

export type PublicLineTemplateStop = {
  locationName: string
  address: string
  stopType: StopType
  offsetMinutesFromStart: number
  dwellMinutes: number
  drivingMinutesFromPrev: number
}

export type PublicLineTemplate = {
  id: string
  depotId: string | null
  name: string
  lineLengthKm: number
  weekdays: number[]
  defaultDepartureTime: string
  defaultStops: PublicLineTemplateStop[]
  active: boolean
  createdAt: number
  updatedAt: number
}
