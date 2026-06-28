import type { ComplianceProfile } from '../constants/compliance'
import type { COMPLIANCE_ISSUE_CODES } from './constants'

export type ComplianceSeverity = 'error' | 'warning' | 'info'

export type ComplianceIssueCode = (typeof COMPLIANCE_ISSUE_CODES)[keyof typeof COMPLIANCE_ISSUE_CODES]

export type ComplianceIssue = {
  code: ComplianceIssueCode
  severity: ComplianceSeverity
  message: string
  context?: Record<string, string | number>
}

export type ComplianceTimelineEvent =
  | { type: 'drive'; minutes: number }
  | { type: 'break'; minutes: number }

export type TourComplianceInput = {
  id?: string
  date: string
  name: string
  complianceProfile: ComplianceProfile
  totalDrivingMinutes: number
  workMinutes: number
  stops: Array<{
    plannedArrival: string
    plannedDeparture: string
    stopType: string
    drivingMinutesFromPrev: number
  }>
}

export type DriverDayDriving = {
  date: string
  drivingMinutes: number
  workMinutes: number
  tourIds: string[]
}

export type ComplianceValidationResult = {
  status: 'ok' | 'warning' | 'error'
  issues: ComplianceIssue[]
  summary: {
    tourDrivingMinutes: number
    tourWorkMinutes: number
    dayDrivingMinutes: number | null
    weekDrivingMinutes: number | null
    fortnightDrivingMinutes: number | null
  }
}
