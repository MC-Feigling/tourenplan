import { and, asc, eq, gte, lte, ne } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { tourStops, tours } from '../database/schema'
import { getDefaultDepotId, nowEpoch } from './access'
import { useDb } from './db'
import {
  addMinutesToTime,
  resolveTourCompliance,
  toPublicTour,
} from './tourHelpers'
import type { TourStatus } from '../../shared/constants/tours'
import { getWeekRangeForDate } from '../../shared/utils/time'
import type { z } from 'zod'
import type { tourCreateSchema, tourStopInputSchema } from '../../shared/schemas/tours'

type LineTourWeekFields = {
  status?: TourStatus
  driverId?: string | null
  vehicleId?: string | null
}

type StopInput = z.infer<typeof tourStopInputSchema>
type TourCreateInput = z.infer<typeof tourCreateSchema>

export async function loadTourWithStops(tourId: string) {
  const { db } = await useDb()
  const [tour] = await db.select().from(tours).where(eq(tours.id, tourId)).limit(1)
  if (!tour) return null
  const stops = await db
    .select()
    .from(tourStops)
    .where(eq(tourStops.tourId, tourId))
    .orderBy(asc(tourStops.sequence))
  return toPublicTour(tour, stops)
}

export async function insertTourStops(tourId: string, stops: StopInput[]) {
  const { db } = await useDb()
  if (stops.length === 0) return
  await db.insert(tourStops).values(
    stops.map((stop, index) => ({
      id: nanoid(),
      tourId,
      sequence: index + 1,
      locationName: stop.locationName,
      address: stop.address ?? '',
      lat: stop.lat != null ? String(stop.lat) : null,
      lng: stop.lng != null ? String(stop.lng) : null,
      plannedArrival: stop.plannedArrival,
      plannedDeparture: stop.plannedDeparture,
      stopType: stop.stopType,
      drivingMinutesFromPrev: stop.drivingMinutesFromPrev,
    })),
  )
}

export async function replaceTourStops(tourId: string, stops: StopInput[]) {
  const { db } = await useDb()
  await db.delete(tourStops).where(eq(tourStops.tourId, tourId))
  await insertTourStops(tourId, stops)
}

export async function createTourRecord(body: TourCreateInput) {
  const { db } = await useDb()
  const depotId = await getDefaultDepotId()
  const now = nowEpoch()
  const id = nanoid()
  const lineLengthKm = body.type === 'line' ? (body.lineLengthKm ?? null) : null
  const complianceProfile = resolveTourCompliance(body.type, lineLengthKm)

  await db.insert(tours).values({
    id,
    depotId,
    type: body.type,
    name: body.name,
    date: body.date,
    status: body.status ?? 'draft',
    complianceProfile,
    lineLengthKm,
    lineTemplateId: body.lineTemplateId ?? null,
    vehicleId: body.vehicleId ?? null,
    driverId: body.driverId ?? null,
    notes: body.notes ?? '',
    createdAt: now,
    updatedAt: now,
  })

  if (body.stops?.length) {
    await insertTourStops(id, body.stops)
  }

  return loadTourWithStops(id)
}

export async function propagateLineTourWeekUpdates(
  sourceTourId: string,
  lineTemplateId: string,
  tourDate: string,
  fields: LineTourWeekFields,
): Promise<void> {
  const keys = Object.keys(fields) as Array<keyof LineTourWeekFields>
  if (keys.length === 0) return

  const { from, to } = getWeekRangeForDate(tourDate)
  const { db } = await useDb()
  const now = nowEpoch()

  await db
    .update(tours)
    .set({
      ...(fields.status !== undefined ? { status: fields.status } : {}),
      ...(fields.driverId !== undefined ? { driverId: fields.driverId } : {}),
      ...(fields.vehicleId !== undefined ? { vehicleId: fields.vehicleId } : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(tours.lineTemplateId, lineTemplateId),
        gte(tours.date, from),
        lte(tours.date, to),
        ne(tours.id, sourceTourId),
      ),
    )
}

export async function listToursInRange(from: string, to: string) {
  const { db } = await useDb()
  const rows = await db
    .select()
    .from(tours)
    .where(and(gte(tours.date, from), lte(tours.date, to)))
    .orderBy(asc(tours.date), asc(tours.name))

  const result = []
  for (const row of rows) {
    const stops = await db
      .select()
      .from(tourStops)
      .where(eq(tourStops.tourId, row.id))
      .orderBy(asc(tourStops.sequence))
    result.push(toPublicTour(row, stops))
  }
  return result
}

export function buildStopsFromTemplate(
  departureTime: string,
  templateStops: Array<{
    locationName: string
    address: string
    stopType: string
    offsetMinutesFromStart: number
    dwellMinutes: number
    drivingMinutesFromPrev: number
  }>,
): StopInput[] {
  return templateStops.map((stop) => {
    const arrival = addMinutesToTime(departureTime, stop.offsetMinutesFromStart)
    const departure = addMinutesToTime(arrival, stop.dwellMinutes)
    return {
      locationName: stop.locationName,
      address: stop.address,
      lat: null,
      lng: null,
      plannedArrival: arrival,
      plannedDeparture: departure,
      stopType: stop.stopType as StopInput['stopType'],
      drivingMinutesFromPrev: stop.drivingMinutesFromPrev,
    }
  })
}
