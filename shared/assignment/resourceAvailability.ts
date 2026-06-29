import { VEHICLE_STATUS_LABELS } from '../constants/vehicles'
import type { PublicTour } from '../types/tours'
import { enrichDriversForDate } from './weekSummary'
import type { AssignmentDriverContext, AssignmentVehicleContext } from './types'
import type { AssignmentResources } from './weekSummary'

export type ResourceAvailabilityStatus = 'available' | 'assigned' | 'blocked'

export type DriverAvailability = AssignmentDriverContext & {
  availability: ResourceAvailabilityStatus
  assignedTourIds: string[]
  assignedTourNames: string[]
  blockReason?: string
}

export type VehicleAvailability = AssignmentVehicleContext & {
  availability: ResourceAvailabilityStatus
  assignedTourIds: string[]
  assignedTourNames: string[]
  blockReason?: string
}

export type ResourceOverview = {
  drivers: DriverAvailability[]
  vehicles: VehicleAvailability[]
  availableDriverCount: number
  availableVehicleCount: number
}

function toursOnDate(tours: PublicTour[], date: string): PublicTour[] {
  return tours.filter((tour) => tour.date === date)
}

export function getDriverAvailabilityForDate(
  driver: AssignmentDriverContext,
  date: string,
  tours: PublicTour[],
): DriverAvailability {
  if (!driver.active) {
    return {
      ...driver,
      availability: 'blocked',
      assignedTourIds: [],
      assignedTourNames: [],
      blockReason: 'inaktiv',
    }
  }

  if (driver.onLeave) {
    return {
      ...driver,
      availability: 'blocked',
      assignedTourIds: [],
      assignedTourNames: [],
      blockReason: driver.leaveTypeLabel ? `abwesend (${driver.leaveTypeLabel})` : 'abwesend',
    }
  }

  const assignedTours = toursOnDate(tours, date).filter((tour) => tour.driverId === driver.id)

  if (assignedTours.length > 0) {
    return {
      ...driver,
      availability: 'assigned',
      assignedTourIds: assignedTours.map((tour) => tour.id),
      assignedTourNames: assignedTours.map((tour) => tour.name),
    }
  }

  return {
    ...driver,
    availability: 'available',
    assignedTourIds: [],
    assignedTourNames: [],
  }
}

export function getVehicleAvailabilityForDate(
  vehicle: AssignmentVehicleContext,
  date: string,
  tours: PublicTour[],
): VehicleAvailability {
  if (vehicle.status !== 'available') {
    return {
      ...vehicle,
      availability: 'blocked',
      assignedTourIds: [],
      assignedTourNames: [],
      blockReason: VEHICLE_STATUS_LABELS[vehicle.status],
    }
  }

  const assignedTours = toursOnDate(tours, date).filter((tour) => tour.vehicleId === vehicle.id)

  if (assignedTours.length > 0) {
    return {
      ...vehicle,
      availability: 'assigned',
      assignedTourIds: assignedTours.map((tour) => tour.id),
      assignedTourNames: assignedTours.map((tour) => tour.name),
    }
  }

  return {
    ...vehicle,
    availability: 'available',
    assignedTourIds: [],
    assignedTourNames: [],
  }
}

export function getResourceOverviewForDate(
  resources: AssignmentResources,
  tours: PublicTour[],
  date: string,
): ResourceOverview {
  const driversForDate = enrichDriversForDate(resources.drivers, resources.leaveRequests, date)
  const drivers = driversForDate.map((driver) => getDriverAvailabilityForDate(driver, date, tours))
  const vehicles = resources.vehicles.map((vehicle) =>
    getVehicleAvailabilityForDate(vehicle, date, tours),
  )

  return {
    drivers,
    vehicles,
    availableDriverCount: drivers.filter((driver) => driver.availability === 'available').length,
    availableVehicleCount: vehicles.filter((vehicle) => vehicle.availability === 'available').length,
  }
}
