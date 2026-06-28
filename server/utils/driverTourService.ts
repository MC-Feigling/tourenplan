import { and, asc, eq, gte, inArray, lte, ne } from 'drizzle-orm'
import {
  canDriverTransitionStatus,
  DRIVER_VISIBLE_STATUSES,
} from '../../shared/constants/driver'
import type { TourStatus } from '../../shared/constants/tours'
import { tourStops, tours, vehicles } from '../database/schema'
import { nowEpoch } from './access'
import { useDb } from './db'
import { toPublicVehicle } from './serializers'
import { toPublicTour } from './tourHelpers'
import type { DriverTour } from '../../shared/types/driver'

async function attachVehicle(tour: ReturnType<typeof toPublicTour>): Promise<DriverTour> {
  if (!tour.vehicleId) {
    return { ...tour, vehicle: null }
  }

  const { db } = await useDb()
  const [vehicleRow] = await db
    .select()
    .from(vehicles)
    .where(eq(vehicles.id, tour.vehicleId))
    .limit(1)

  if (!vehicleRow) {
    return { ...tour, vehicle: null }
  }

  const vehicle = toPublicVehicle(vehicleRow)
  return {
    ...tour,
    vehicle: {
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      name: vehicle.name,
      seats: vehicle.seats,
    },
  }
}

async function loadStopsForTours(tourIds: string[]) {
  const { db } = await useDb()
  if (tourIds.length === 0) return new Map<string, typeof tourStops.$inferSelect[]>()

  const allStops = await db
    .select()
    .from(tourStops)
    .where(inArray(tourStops.tourId, tourIds))
    .orderBy(asc(tourStops.sequence))

  const stopsByTour = new Map<string, typeof allStops>()
  for (const stop of allStops) {
    const list = stopsByTour.get(stop.tourId) ?? []
    list.push(stop)
    stopsByTour.set(stop.tourId, list)
  }
  return stopsByTour
}

export async function listDriverTours(
  driverId: string,
  from: string,
  to: string,
): Promise<DriverTour[]> {
  const { db } = await useDb()
  const rows = await db
    .select()
    .from(tours)
    .where(
      and(
        eq(tours.driverId, driverId),
        gte(tours.date, from),
        lte(tours.date, to),
        ne(tours.status, 'draft'),
        inArray(tours.status, [...DRIVER_VISIBLE_STATUSES]),
      ),
    )
    .orderBy(asc(tours.date), asc(tours.name))

  const stopsByTour = await loadStopsForTours(rows.map((row) => row.id))
  const result: DriverTour[] = []

  for (const row of rows) {
    const stops = stopsByTour.get(row.id) ?? []
    const tour = await attachVehicle(toPublicTour(row, stops))
    result.push(tour)
  }

  return result
}

export async function loadDriverTour(
  driverId: string,
  tourId: string,
): Promise<DriverTour | null> {
  const { db } = await useDb()
  const [row] = await db
    .select()
    .from(tours)
    .where(and(eq(tours.id, tourId), eq(tours.driverId, driverId)))
    .limit(1)

  if (!row || row.status === 'draft') return null

  const stops = await db
    .select()
    .from(tourStops)
    .where(eq(tourStops.tourId, tourId))
    .orderBy(asc(tourStops.sequence))

  return attachVehicle(toPublicTour(row, stops))
}

export async function updateDriverTourStatus(
  driverId: string,
  tourId: string,
  nextStatus: TourStatus,
): Promise<DriverTour | null> {
  const { db } = await useDb()
  const [row] = await db
    .select()
    .from(tours)
    .where(and(eq(tours.id, tourId), eq(tours.driverId, driverId)))
    .limit(1)

  if (!row) return null

  const currentStatus = row.status as TourStatus
  if (!canDriverTransitionStatus(currentStatus, nextStatus)) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Statusänderung nicht erlaubt',
    })
  }

  await db
    .update(tours)
    .set({ status: nextStatus, updatedAt: nowEpoch() })
    .where(eq(tours.id, tourId))

  return loadDriverTour(driverId, tourId)
}
