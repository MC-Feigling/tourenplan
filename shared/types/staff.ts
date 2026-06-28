import type { EmploymentType, LeaveType, LicenseClass, StaffJobRole, StaffQualification } from '../constants/staff'
import type { TachoType, VehicleClass, VehicleFeature, VehicleStatus } from '../constants/vehicles'

export type PublicStaffMember = {
  id: string
  depotId: string | null
  userId: string | null
  firstName: string
  lastName: string
  fullName: string
  phone: string
  email: string
  jobRole: StaffJobRole
  licenseClasses: LicenseClass[]
  qualifications: StaffQualification[]
  employmentType: EmploymentType
  active: boolean
  createdAt: number
  updatedAt: number
}

export type PublicLeaveRequest = {
  id: string
  staffMemberId: string
  startDate: string
  endDate: string
  type: LeaveType
  note: string
  createdAt: number
}

export type PublicVehicle = {
  id: string
  depotId: string | null
  plateNumber: string
  name: string
  seats: number
  vehicleClass: VehicleClass
  status: VehicleStatus
  features: VehicleFeature[]
  tachoType: TachoType
  nextInspectionDate: string | null
  nextMaintenanceKm: number | null
  notes: string
  requiresTacho: boolean
  createdAt: number
  updatedAt: number
}
