import type { LicenseClass, StaffJobRole, StaffQualification, EmploymentType } from '../../shared/constants/staff'
import { LICENSE_CLASSES, STAFF_JOB_ROLES, STAFF_QUALIFICATIONS, EMPLOYMENT_TYPES } from '../../shared/constants/staff'
import type { LeaveType } from '../../shared/constants/staff'
import { LEAVE_TYPES } from '../../shared/constants/staff'
import type { StaffMemberRow, LeaveRequestRow, VehicleRow } from '../database/schema'
import type { PublicLeaveRequest, PublicStaffMember, PublicVehicle } from '../../shared/types/staff'
import {
  TACHO_TYPES,
  VEHICLE_CLASSES,
  VEHICLE_FEATURES,
  VEHICLE_STATUSES,
  PASSENGER_TACHO_THRESHOLD,
  type TachoType,
  type VehicleClass,
  type VehicleFeature,
  type VehicleStatus,
} from '../../shared/constants/vehicles'

function parseEnumArray<T extends string>(values: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(values)) return []
  return values.filter((v): v is T => typeof v === 'string' && (allowed as readonly string[]).includes(v))
}

export function toPublicStaff(row: StaffMemberRow): PublicStaffMember {
  const jobRole = (STAFF_JOB_ROLES as readonly string[]).includes(row.jobRole)
    ? (row.jobRole as StaffJobRole)
    : 'driver'
  const employmentType = (EMPLOYMENT_TYPES as readonly string[]).includes(row.employmentType)
    ? (row.employmentType as EmploymentType)
    : 'full'

  return {
    id: row.id,
    depotId: row.depotId,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: `${row.firstName} ${row.lastName}`.trim(),
    phone: row.phone,
    email: row.email,
    jobRole,
    licenseClasses: parseEnumArray(row.licenseClasses, LICENSE_CLASSES),
    qualifications: parseEnumArray(row.qualifications, STAFF_QUALIFICATIONS),
    employmentType,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function toPublicLeave(row: LeaveRequestRow): PublicLeaveRequest {
  const type = (LEAVE_TYPES as readonly string[]).includes(row.type)
    ? (row.type as LeaveType)
    : 'other'
  return {
    id: row.id,
    staffMemberId: row.staffMemberId,
    startDate: row.startDate,
    endDate: row.endDate,
    type,
    note: row.note,
    createdAt: row.createdAt,
  }
}

export function toPublicVehicle(row: VehicleRow): PublicVehicle {
  const vehicleClass = (VEHICLE_CLASSES as readonly string[]).includes(row.vehicleClass)
    ? (row.vehicleClass as VehicleClass)
    : 'coach'
  const status = (VEHICLE_STATUSES as readonly string[]).includes(row.status)
    ? (row.status as VehicleStatus)
    : 'available'
  const tachoType = (TACHO_TYPES as readonly string[]).includes(row.tachoType)
    ? (row.tachoType as TachoType)
    : 'none'

  return {
    id: row.id,
    depotId: row.depotId,
    plateNumber: row.plateNumber,
    name: row.name,
    seats: row.seats,
    vehicleClass,
    status,
    features: parseEnumArray(row.features, VEHICLE_FEATURES),
    tachoType,
    nextInspectionDate: row.nextInspectionDate,
    nextMaintenanceKm: row.nextMaintenanceKm,
    notes: row.notes,
    requiresTacho: row.seats >= PASSENGER_TACHO_THRESHOLD,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}
