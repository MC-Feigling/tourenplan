import { WORKING_TIME, COMPLIANCE_ISSUE_CODES } from '../constants'
import type { ComplianceIssue } from '../types'

export function validateWorkingTime(workMinutes: number, date: string): ComplianceIssue[] {
  if (workMinutes <= WORKING_TIME.DE_ARBZG_MAX_DAILY_MIN) return []

  return [
    {
      code: COMPLIANCE_ISSUE_CODES.DAILY_WORK_TIME_WARNING,
      severity: 'warning',
      message: `Arbeitszeit am ${date}: ${formatHours(workMinutes)} — ArbZG-Limit 10h prüfen`,
      context: {
        date,
        workMinutes,
        limitMinutes: WORKING_TIME.DE_ARBZG_MAX_DAILY_MIN,
      },
    },
  ]
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
