import { WORKING_TIME, COMPLIANCE_ISSUE_CODES } from '../constants'
import type { ComplianceIssue, DriverDayDriving } from '../types'

export function validateWeeklyRest(
  targetDate: string,
  tourDrivingMinutes: number,
  weekDays: DriverDayDriving[],
): ComplianceIssue[] {
  const workDays = weekDays.filter((day) => {
    const extra = day.date === targetDate ? tourDrivingMinutes : 0
    return day.drivingMinutes + extra > 0
  }).length

  if (workDays <= WORKING_TIME.MAX_WORK_DAYS_PER_WEEK) return []

  return [
    {
      code: COMPLIANCE_ISSUE_CODES.WEEKLY_REST_MISSING,
      severity: 'error',
      message: `${workDays} Einsatztage in der Woche — nach 6 Tagen ist 1 Ruhetag Pflicht`,
      context: {
        workDays,
        limitDays: WORKING_TIME.MAX_WORK_DAYS_PER_WEEK,
      },
    },
  ]
}
