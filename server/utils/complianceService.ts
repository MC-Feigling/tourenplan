import { and, asc, eq, gte, inArray, lte, ne } from 'drizzle-orm'
import { tourStops, tours } from '../database/schema'
import { useDb } from './db'
import { toPublicTour } from './tourHelpers'
import {
  calculateTourWorkMinutes,
  getAdjacentWeekKey,
  getIsoWeekKey,
  getWeekDates,
} from '../../shared/compliance/timeline'
import type { DriverDayDriving, TourComplianceInput } from '../../shared/compliance/types'
import type { PublicTour } from '../../shared/types/tours'

export async function loadDriverWeekDriving(
  driverId: string,
  date: string,
  excludeTourId?: string,
): Promise<{ weekDays: DriverDayDriving[]; previousWeekDrivingMinutes: number }> {
  const weekKey = getIsoWeekKey(date)
  const weekDates = getWeekDates(weekKey)
  const prevWeekDates = getWeekDates(getAdjacentWeekKey(weekKey, -1))

  const { db } = await useDb()
  const allDates = [...weekDates, ...prevWeekDates]

  const rows = await db
    .select()
    .from(tours)
    .where(
      and(
        eq(tours.driverId, driverId),
        gte(tours.date, allDates[0]!),
        lte(tours.date, allDates[allDates.length - 1]!),
        excludeTourId ? ne(tours.id, excludeTourId) : undefined,
      ),
    )

  const tourIds = rows.map((r) => r.id)
  const stopsByTour = new Map<string, typeof tourStops.$inferSelect[]>()

  if (tourIds.length > 0) {
    const allStops = await db
      .select()
      .from(tourStops)
      .where(inArray(tourStops.tourId, tourIds))
      .orderBy(asc(tourStops.sequence))

    for (const stop of allStops) {
      const list = stopsByTour.get(stop.tourId) ?? []
      list.push(stop)
      stopsByTour.set(stop.tourId, list)
    }
  }

  const dayMap = new Map<string, DriverDayDriving>()
  for (const d of weekDates) {
    dayMap.set(d, { date: d, drivingMinutes: 0, workMinutes: 0, tourIds: [] })
  }

  let previousWeekDrivingMinutes = 0

  for (const row of rows) {
    const stops = stopsByTour.get(row.id) ?? []
    const publicTour = toPublicTour(row, stops)
    const driving = publicTour.totalDrivingMinutes
    const work = calculateTourWorkMinutes(publicTour.stops)

    if (weekDates.includes(row.date)) {
      const entry = dayMap.get(row.date)!
      entry.drivingMinutes += driving
      entry.workMinutes += work
      entry.tourIds.push(row.id)
    } else if (prevWeekDates.includes(row.date)) {
      previousWeekDrivingMinutes += driving
    }
  }

  return {
    weekDays: [...dayMap.values()],
    previousWeekDrivingMinutes,
  }
}

export function publicTourToComplianceInput(tour: PublicTour): TourComplianceInput {
  return {
    id: tour.id,
    date: tour.date,
    name: tour.name,
    complianceProfile: tour.complianceProfile,
    totalDrivingMinutes: tour.totalDrivingMinutes,
    workMinutes: calculateTourWorkMinutes(tour.stops),
    stops: tour.stops.map((s) => ({
      plannedArrival: s.plannedArrival,
      plannedDeparture: s.plannedDeparture,
      stopType: s.stopType,
      drivingMinutesFromPrev: s.drivingMinutesFromPrev,
    })),
  }
}

export function draftToComplianceInput(draft: {
  date: string
  name: string
  complianceProfile: TourComplianceInput['complianceProfile']
  stops: TourComplianceInput['stops']
}): TourComplianceInput {
  const totalDrivingMinutes = draft.stops.reduce((sum, s) => sum + s.drivingMinutesFromPrev, 0)
  return {
    date: draft.date,
    name: draft.name,
    complianceProfile: draft.complianceProfile,
    totalDrivingMinutes,
    workMinutes: calculateTourWorkMinutes(draft.stops),
    stops: draft.stops,
  }
}
