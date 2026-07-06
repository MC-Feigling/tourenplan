import { COMPLIANCE_PROFILES, resolveComplianceProfile } from '../../shared/constants/compliance'
import type { ComplianceProfile } from '../../shared/constants/compliance'
import { STOP_TYPES, TOUR_STATUSES, TOUR_TYPES } from '../../shared/constants/tours'
import type { StopType, TourStatus, TourType } from '../../shared/constants/tours'
import type {
  LineTemplateRow,
  TourRow,
  TourStopRow,
} from '../database/schema'
import type {
  PublicLineTemplate,
  PublicLineTemplateStop,
  PublicTour,
  PublicTourStop,
} from '../../shared/types/tours'

function parseEnum<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function parseLineTemplateStops(raw: unknown): PublicLineTemplateStop[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      locationName: String(item.locationName ?? ''),
      address: String(item.address ?? ''),
      stopType: parseEnum(String(item.stopType ?? 'pickup'), STOP_TYPES, 'pickup'),
      offsetMinutesFromStart: Number(item.offsetMinutesFromStart ?? 0),
      dwellMinutes: Number(item.dwellMinutes ?? 5),
      drivingMinutesFromPrev: Number(item.drivingMinutesFromPrev ?? 0),
    }))
    .filter((s) => s.locationName.length > 0)
}

export function toPublicTourStop(row: TourStopRow): PublicTourStop {
  return {
    id: row.id,
    tourId: row.tourId,
    sequence: row.sequence,
    locationName: row.locationName,
    address: row.address,
    lat: row.lat ? Number(row.lat) : null,
    lng: row.lng ? Number(row.lng) : null,
    plannedArrival: row.plannedArrival,
    plannedDeparture: row.plannedDeparture,
    stopType: parseEnum(row.stopType, STOP_TYPES, 'pickup'),
    drivingMinutesFromPrev: row.drivingMinutesFromPrev,
  }
}

export function sumDrivingMinutes(stops: Pick<PublicTourStop, 'drivingMinutesFromPrev'>[]): number {
  return stops.reduce((sum, stop) => sum + stop.drivingMinutesFromPrev, 0)
}

export function toPublicTour(row: TourRow, stops: TourStopRow[]): PublicTour {
  const publicStops = stops
    .sort((a, b) => a.sequence - b.sequence)
    .map(toPublicTourStop)
  const tourType = parseEnum(row.type, TOUR_TYPES, 'excursion')
  const complianceProfile = parseEnum(row.complianceProfile, COMPLIANCE_PROFILES, 'STANDARD_561_2006')

  return {
    id: row.id,
    depotId: row.depotId,
    type: tourType,
    name: row.name,
    date: row.date,
    status: parseEnum(row.status, TOUR_STATUSES, 'draft'),
    complianceProfile,
    lineLengthKm: row.lineLengthKm,
    lineTemplateId: row.lineTemplateId,
    vehicleId: row.vehicleId,
    driverId: row.driverId,
    notes: row.notes,
    totalDrivingMinutes: sumDrivingMinutes(publicStops),
    stops: publicStops,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function toPublicLineTemplate(row: LineTemplateRow): PublicLineTemplate {
  const weekdays = Array.isArray(row.weekdays)
    ? row.weekdays.filter((d): d is number => typeof d === 'number' && d >= 1 && d <= 7)
    : []

  return {
    id: row.id,
    depotId: row.depotId,
    name: row.name,
    lineLengthKm: row.lineLengthKm,
    weekdays,
    defaultDepartureTime: row.defaultDepartureTime,
    defaultStops: parseLineTemplateStops(row.defaultStops),
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function resolveTourCompliance(
  type: TourType,
  lineLengthKm: number | null | undefined,
): ComplianceProfile {
  return resolveComplianceProfile(type, lineLengthKm ?? null)
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h = 0, m = 0] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const hh = Math.floor(wrapped / 60)
  const mm = wrapped % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function isoWeekdayFromDate(date: string): number {
  const d = new Date(`${date}T12:00:00`)
  const day = d.getDay()
  return day === 0 ? 7 : day
}

export function datesBetween(from: string, to: string): string[] {
  const result: string[] = []
  const cursor = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  while (cursor <= end) {
    result.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}
