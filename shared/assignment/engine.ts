import { VEHICLE_STATUS_LABELS } from '../constants/vehicles'
import { ASSIGNMENT_ISSUE_CODES } from './constants'
import { getTourTimeWindow, timeWindowsOverlap } from './time'
import type {
  AssignmentIssue,
  AssignmentTourRef,
  AssignmentValidationContext,
  AssignmentValidationInput,
  AssignmentValidationResult,
  OverallAssignmentStatus,
} from './types'

const BUS_LICENSES = new Set(['D', 'D1', 'DE'])

function resolveStatus(issues: AssignmentIssue[]): AssignmentValidationResult['status'] {
  if (issues.some((issue) => issue.severity === 'error')) return 'error'
  if (issues.some((issue) => issue.severity === 'warning')) return 'warning'
  return 'ok'
}

function findConflicts(
  tourId: string | undefined,
  date: string,
  window: { start: number; end: number },
  resourceId: string,
  field: 'driverId' | 'vehicleId',
  otherTours: AssignmentTourRef[],
): AssignmentTourRef[] {
  return otherTours.filter((other) => {
    if (tourId && other.id === tourId) return false
    if (other.date !== date) return false
    if (other[field] !== resourceId) return false
    return timeWindowsOverlap(window, { start: other.windowStart, end: other.windowEnd })
  })
}

export function validateAssignment(
  input: AssignmentValidationInput,
  context: AssignmentValidationContext,
): AssignmentValidationResult {
  const issues: AssignmentIssue[] = []
  const window = getTourTimeWindow(input.stops)
  const driverAssigned = Boolean(input.driverId)
  const vehicleAssigned = Boolean(input.vehicleId)

  if (!driverAssigned) {
    issues.push({
      code: ASSIGNMENT_ISSUE_CODES.DRIVER_NOT_ASSIGNED,
      severity: 'warning',
      message: 'Kein Fahrer zugewiesen',
    })
  }

  if (!vehicleAssigned) {
    issues.push({
      code: ASSIGNMENT_ISSUE_CODES.VEHICLE_NOT_ASSIGNED,
      severity: 'warning',
      message: 'Kein Fahrzeug zugewiesen',
    })
  }

  if (input.driverId) {
    const driver = context.drivers.find((item) => item.id === input.driverId)
    if (!driver) {
      issues.push({
        code: ASSIGNMENT_ISSUE_CODES.DRIVER_NOT_FOUND,
        severity: 'error',
        message: 'Fahrer nicht gefunden',
      })
    } else {
      if (!driver.active) {
        issues.push({
          code: ASSIGNMENT_ISSUE_CODES.DRIVER_INACTIVE,
          severity: 'error',
          message: `${driver.fullName} ist inaktiv`,
        })
      }

      if (driver.onLeave) {
        issues.push({
          code: ASSIGNMENT_ISSUE_CODES.DRIVER_ON_LEAVE,
          severity: 'error',
          message: driver.leaveTypeLabel
            ? `${driver.fullName} abwesend (${driver.leaveTypeLabel})`
            : `${driver.fullName} ist an diesem Tag abwesend`,
        })
      }

      const hasBusLicense = driver.licenseClasses.some((license) => BUS_LICENSES.has(license))
      if (!hasBusLicense) {
        issues.push({
          code: ASSIGNMENT_ISSUE_CODES.DRIVER_LICENSE_MISSING,
          severity: 'warning',
          message: `${driver.fullName} hat keine Bus-Führerscheinklasse (D/D1/DE)`,
        })
      }

      if (window) {
        const conflicts = findConflicts(
          input.tourId,
          input.date,
          window,
          input.driverId,
          'driverId',
          context.otherTours,
        )
        for (const conflict of conflicts) {
          issues.push({
            code: ASSIGNMENT_ISSUE_CODES.DRIVER_DOUBLE_BOOKED,
            severity: 'error',
            message: `${driver.fullName} bereits auf Tour „${conflict.name}"`,
            context: { conflictTourId: conflict.id },
          })
        }
      }
    }
  }

  if (input.vehicleId) {
    const vehicle = context.vehicles.find((item) => item.id === input.vehicleId)
    if (!vehicle) {
      issues.push({
        code: ASSIGNMENT_ISSUE_CODES.VEHICLE_NOT_FOUND,
        severity: 'error',
        message: 'Fahrzeug nicht gefunden',
      })
    } else {
      if (vehicle.status !== 'available') {
        issues.push({
          code: ASSIGNMENT_ISSUE_CODES.VEHICLE_UNAVAILABLE,
          severity: 'error',
          message: `${vehicle.name} — ${VEHICLE_STATUS_LABELS[vehicle.status]}`,
        })
      }

      if (window) {
        const conflicts = findConflicts(
          input.tourId,
          input.date,
          window,
          input.vehicleId,
          'vehicleId',
          context.otherTours,
        )
        for (const conflict of conflicts) {
          issues.push({
            code: ASSIGNMENT_ISSUE_CODES.VEHICLE_DOUBLE_BOOKED,
            severity: 'error',
            message: `${vehicle.plateNumber} bereits auf Tour „${conflict.name}"`,
            context: { conflictTourId: conflict.id },
          })
        }
      }
    }
  }

  return {
    status: resolveStatus(issues),
    issues,
    driverAssigned,
    vehicleAssigned,
  }
}

export function mergeOverallStatus(
  ...statuses: OverallAssignmentStatus[]
): OverallAssignmentStatus {
  if (statuses.some((status) => status === 'error')) return 'error'
  if (statuses.some((status) => status === 'warning')) return 'warning'
  return 'ok'
}
