import type { LicenseClass } from '../constants/staff'
import type { VehicleStatus } from '../constants/vehicles'
import type { ASSIGNMENT_ISSUE_CODES } from './constants'

export type AssignmentSeverity = 'error' | 'warning' | 'info'

export type AssignmentIssueCode =
  (typeof ASSIGNMENT_ISSUE_CODES)[keyof typeof ASSIGNMENT_ISSUE_CODES]

export type AssignmentIssue = {
  code: AssignmentIssueCode
  severity: AssignmentSeverity
  message: string
  context?: Record<string, string | number>
}

export type AssignmentValidationResult = {
  status: 'ok' | 'warning' | 'error'
  issues: AssignmentIssue[]
  driverAssigned: boolean
  vehicleAssigned: boolean
}

export type AssignmentTourRef = {
  id: string
  name: string
  date: string
  driverId: string | null
  vehicleId: string | null
  windowStart: number
  windowEnd: number
}

export type AssignmentDriverContext = {
  id: string
  fullName: string
  active: boolean
  licenseClasses: LicenseClass[]
  onLeave: boolean
  leaveTypeLabel?: string
}

export type AssignmentVehicleContext = {
  id: string
  name: string
  plateNumber: string
  status: VehicleStatus
}

export type AssignmentStopWindow = {
  plannedArrival: string
  plannedDeparture: string
}

export type AssignmentValidationInput = {
  tourId?: string
  date: string
  driverId: string | null
  vehicleId: string | null
  stops: AssignmentStopWindow[]
}

export type AssignmentValidationContext = {
  drivers: AssignmentDriverContext[]
  vehicles: AssignmentVehicleContext[]
  otherTours: AssignmentTourRef[]
}

export type OverallAssignmentStatus = 'ok' | 'warning' | 'error'
