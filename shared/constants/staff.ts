export const LICENSE_CLASSES = ['D', 'D1', 'DE'] as const
export type LicenseClass = (typeof LICENSE_CLASSES)[number]

export const STAFF_QUALIFICATIONS = ['BKrFQG', 'ADR', 'GUEST_GUIDE'] as const
export type StaffQualification = (typeof STAFF_QUALIFICATIONS)[number]

export const STAFF_JOB_ROLES = ['driver', 'dispatcher', 'other'] as const
export type StaffJobRole = (typeof STAFF_JOB_ROLES)[number]

export const EMPLOYMENT_TYPES = ['full', 'part'] as const
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

export const LEAVE_TYPES = ['vacation', 'sick', 'other'] as const
export type LeaveType = (typeof LEAVE_TYPES)[number]

export const STAFF_JOB_ROLE_LABELS: Record<StaffJobRole, string> = {
  driver: 'Fahrer',
  dispatcher: 'Disponent',
  other: 'Sonstige',
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  vacation: 'Urlaub',
  sick: 'Krank',
  other: 'Sonstiges',
}
