import { WORKING_TIME, COMPLIANCE_ISSUE_CODES } from '../constants'
import type { ComplianceIssue } from '../types'
import { restMinutesBetween } from '../timeline'

export function validateDailyRest(
  previousDate: string,
  previousShiftEnd: string,
  nextDate: string,
  nextShiftStart: string,
): ComplianceIssue[] {
  const restMinutes = restMinutesBetween(previousDate, previousShiftEnd, nextDate, nextShiftStart)
  if (restMinutes >= WORKING_TIME.DAILY_REST_MIN) return []

  return [
    {
      code: COMPLIANCE_ISSUE_CODES.INSUFFICIENT_DAILY_REST,
      severity: 'error',
      message: `Tagesruhe ${formatHours(Math.max(restMinutes, 0))} unter 11h (${previousDate} ${previousShiftEnd} → ${nextDate} ${nextShiftStart})`,
      context: {
        previousDate,
        nextDate,
        restMinutes,
        limitMinutes: WORKING_TIME.DAILY_REST_MIN,
      },
    },
  ]
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
