import { LEAVE_TYPE_LABELS } from '../constants/staff'
import { validateAssignment } from './engine'
import { getTourTimeWindow } from './time'
import type {
  AssignmentDriverContext,
  AssignmentTourRef,
  AssignmentValidationContext,
  AssignmentValidationResult,
  AssignmentVehicleContext,
} from './types'
import type { PublicLeaveRequest } from '../types/staff'
import type { PublicTour } from '../types/tours'

export type AssignmentResources = {
  drivers: AssignmentDriverContext[]
  vehicles: AssignmentVehicleContext[]
  leaveRequests: PublicLeaveRequest[]
}

function isLeaveOnDate(startDate: string, endDate: string, date: string): boolean {
  return date >= startDate && date <= endDate
}

export function enrichDriversForDate(
  drivers: AssignmentDriverContext[],
  leaveRequests: PublicLeaveRequest[],
  date: string,
): AssignmentDriverContext[] {
  return drivers.map((driver) => {
    const leave = leaveRequests.find(
      (item) =>
        item.staffMemberId === driver.id &&
        isLeaveOnDate(item.startDate, item.endDate, date),
    )
    return {
      ...driver,
      onLeave: Boolean(leave),
      leaveTypeLabel: leave ? LEAVE_TYPE_LABELS[leave.type] : undefined,
    }
  })
}

export function tourToAssignmentRef(tour: PublicTour): AssignmentTourRef | null {
  const window = getTourTimeWindow(tour.stops)
  if (!window) return null
  return {
    id: tour.id,
    name: tour.name,
    date: tour.date,
    driverId: tour.driverId,
    vehicleId: tour.vehicleId,
    windowStart: window.start,
    windowEnd: window.end,
  }
}

export function buildWeekAssignmentContext(
  tours: PublicTour[],
  resources: AssignmentResources,
  targetTour: PublicTour,
): AssignmentValidationContext {
  const otherTours = tours
    .filter((tour) => tour.id !== targetTour.id)
    .map(tourToAssignmentRef)
    .filter((tour): tour is AssignmentTourRef => tour !== null)

  return {
    drivers: enrichDriversForDate(resources.drivers, resources.leaveRequests, targetTour.date),
    vehicles: resources.vehicles,
    otherTours,
  }
}

export function summarizeTourAssignment(
  tour: PublicTour,
  allTours: PublicTour[],
  resources: AssignmentResources,
): AssignmentValidationResult {
  const context = buildWeekAssignmentContext(allTours, resources, tour)
  return validateAssignment(
    {
      tourId: tour.id,
      date: tour.date,
      driverId: tour.driverId,
      vehicleId: tour.vehicleId,
      stops: tour.stops,
    },
    context,
  )
}
