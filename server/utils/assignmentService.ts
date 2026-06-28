import { and, asc, eq, gte, inArray, isNotNull, lte, ne, or } from 'drizzle-orm'
import { LEAVE_TYPE_LABELS } from '../../shared/constants/staff'
import { validateAssignment } from '../../shared/assignment/engine'
import { getTourTimeWindow } from '../../shared/assignment/time'
import type {
  AssignmentDriverContext,
  AssignmentTourRef,
  AssignmentValidationContext,
  AssignmentValidationInput,
  AssignmentVehicleContext,
} from '../../shared/assignment/types'
import type { PublicLeaveRequest } from '../../shared/types/staff'
import { leaveRequests, staffMembers, tourStops, tours, vehicles } from '../database/schema'
import { useDb } from './db'
import { toPublicStaff, toPublicLeave, toPublicVehicle } from './serializers'
import { toPublicTour } from './tourHelpers'

function isLeaveOnDate(startDate: string, endDate: string, date: string): boolean {
  return date >= startDate && date <= endDate
}

function resolveDriverLeave(
  staffMemberId: string,
  date: string,
  leaveRows: PublicLeaveRequest[],
): Pick<AssignmentDriverContext, 'onLeave' | 'leaveTypeLabel'> {
  const activeLeave = leaveRows.find(
    (leave) =>
      leave.staffMemberId === staffMemberId &&
      isLeaveOnDate(leave.startDate, leave.endDate, date),
  )
  return {
    onLeave: Boolean(activeLeave),
    leaveTypeLabel: activeLeave ? LEAVE_TYPE_LABELS[activeLeave.type] : undefined,
  }
}

export async function loadAssignmentResources(from: string, to: string) {
  const { db } = await useDb()

  const [driverRows, vehicleRows, leaveRows] = await Promise.all([
    db
      .select()
      .from(staffMembers)
      .where(eq(staffMembers.jobRole, 'driver'))
      .orderBy(asc(staffMembers.lastName), asc(staffMembers.firstName)),
    db.select().from(vehicles).orderBy(asc(vehicles.name)),
    db
      .select()
      .from(leaveRequests)
      .where(and(lte(leaveRequests.startDate, to), gte(leaveRequests.endDate, from))),
  ])

  const publicLeave = leaveRows.map(toPublicLeave)

  const drivers: AssignmentDriverContext[] = driverRows.map((row) => {
    const publicStaff = toPublicStaff(row)
    return {
      id: publicStaff.id,
      fullName: publicStaff.fullName,
      active: publicStaff.active,
      licenseClasses: publicStaff.licenseClasses,
      onLeave: false,
    }
  })

  const vehicleList: AssignmentVehicleContext[] = vehicleRows.map((row) => {
    const publicVehicle = toPublicVehicle(row)
    return {
      id: publicVehicle.id,
      name: publicVehicle.name,
      plateNumber: publicVehicle.plateNumber,
      status: publicVehicle.status,
    }
  })

  return {
    drivers,
    vehicles: vehicleList,
    leaveRequests: publicLeave,
  }
}

export async function loadAssignmentTourRefs(
  from: string,
  to: string,
  excludeTourId?: string,
): Promise<AssignmentTourRef[]> {
  const { db } = await useDb()
  const rows = await db
    .select()
    .from(tours)
    .where(
      and(
        gte(tours.date, from),
        lte(tours.date, to),
        excludeTourId ? ne(tours.id, excludeTourId) : undefined,
        or(isNotNull(tours.driverId), isNotNull(tours.vehicleId)),
      ),
    )

  if (rows.length === 0) return []

  const tourIds = rows.map((row) => row.id)
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

  const refs: AssignmentTourRef[] = []
  for (const row of rows) {
    const stops = stopsByTour.get(row.id) ?? []
    const publicTour = toPublicTour(row, stops)
    const window = getTourTimeWindow(publicTour.stops)
    if (!window) continue

    refs.push({
      id: publicTour.id,
      name: publicTour.name,
      date: publicTour.date,
      driverId: publicTour.driverId,
      vehicleId: publicTour.vehicleId,
      windowStart: window.start,
      windowEnd: window.end,
    })
  }

  return refs
}

export async function buildAssignmentContext(
  input: AssignmentValidationInput,
): Promise<AssignmentValidationContext> {
  const resources = await loadAssignmentResources(input.date, input.date)
  const otherTours = await loadAssignmentTourRefs(input.date, input.date, input.tourId)

  const drivers = resources.drivers.map((driver) => ({
    ...driver,
    ...resolveDriverLeave(driver.id, input.date, resources.leaveRequests),
  }))

  return {
    drivers,
    vehicles: resources.vehicles,
    otherTours,
  }
}

export async function validateTourAssignment(input: AssignmentValidationInput) {
  const context = await buildAssignmentContext(input)
  return validateAssignment(input, context)
}

export function driverOnLeaveForDate(
  staffMemberId: string,
  date: string,
  leaveRows: PublicLeaveRequest[],
): boolean {
  return leaveRows.some(
    (leave) =>
      leave.staffMemberId === staffMemberId &&
      isLeaveOnDate(leave.startDate, leave.endDate, date),
  )
}
