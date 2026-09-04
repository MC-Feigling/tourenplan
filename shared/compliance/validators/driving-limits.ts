import { DRIVING, COMPLIANCE_ISSUE_CODES } from '../constants'
import type { ComplianceIssue, DriverDayDriving } from '../types'

export function validateTourDailyDriving(totalDrivingMinutes: number): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []

  if (totalDrivingMinutes > DRIVING.MAX_DAILY_EXTENDED_MIN) {
    issues.push({
      code: COMPLIANCE_ISSUE_CODES.DAILY_DRIVING_EXTENDED_EXCEEDED,
      severity: 'error',
      message: `Tageslenkzeit ${formatHours(totalDrivingMinutes)} überschreitet 10h`,
      context: { drivingMinutes: totalDrivingMinutes, limitMinutes: DRIVING.MAX_DAILY_EXTENDED_MIN },
    })
  } else if (totalDrivingMinutes > DRIVING.MAX_DAILY_MIN) {
    issues.push({
      code: COMPLIANCE_ISSUE_CODES.DAILY_DRIVING_EXCEEDED,
      severity: 'warning',
      message: `Tageslenkzeit ${formatHours(totalDrivingMinutes)} überschreitet 9h — 10h max. 2×/Woche`,
      context: { drivingMinutes: totalDrivingMinutes, limitMinutes: DRIVING.MAX_DAILY_MIN },
    })
  }

  return issues
}

export function validateDriverAggregates(
  targetDate: string,
  tourDrivingMinutes: number,
  weekDays: DriverDayDriving[],
): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []

  const dayBase = weekDays.find((d) => d.date === targetDate)?.drivingMinutes ?? 0
  const dayTotal = dayBase + tourDrivingMinutes

  if (dayTotal > DRIVING.MAX_DAILY_EXTENDED_MIN) {
    issues.push({
      code: COMPLIANCE_ISSUE_CODES.DAILY_DRIVING_EXTENDED_EXCEEDED,
      severity: 'error',
      message: `Tageslenkzeit am ${targetDate}: ${formatHours(dayTotal)} (max. 10h)`,
      context: { date: targetDate, drivingMinutes: dayTotal },
    })
  } else if (dayTotal > DRIVING.MAX_DAILY_MIN) {
    const otherExtensions = weekDays.filter(
      (day) => day.date !== targetDate && day.drivingMinutes > DRIVING.MAX_DAILY_MIN,
    ).length

    if (otherExtensions >= DRIVING.MAX_DAILY_EXTENSIONS_PER_WEEK) {
      issues.push({
        code: COMPLIANCE_ISSUE_CODES.DAILY_DRIVING_EXCEEDED,
        severity: 'error',
        message: `Tageslenkzeit am ${targetDate}: ${formatHours(dayTotal)} — 10h bereits ${otherExtensions}× diese Woche`,
        context: { date: targetDate, drivingMinutes: dayTotal, extensionsUsed: otherExtensions },
      })
    }
  }

  const weekTotal = weekDays.reduce((sum, day) => {
    const extra = day.date === targetDate ? tourDrivingMinutes : 0
    return sum + day.drivingMinutes + extra
  }, 0)

  if (weekTotal > DRIVING.MAX_WEEKLY_MIN) {
    issues.push({
      code: COMPLIANCE_ISSUE_CODES.WEEKLY_DRIVING_EXCEEDED,
      severity: 'error',
      message: `Wochenlenkzeit ${formatHours(weekTotal)} überschreitet 56h`,
      context: { drivingMinutes: weekTotal, limitMinutes: DRIVING.MAX_WEEKLY_MIN },
    })
  }

  return issues
}

export function validateFortnightDriving(
  weekDrivingMinutes: number,
  previousWeekDrivingMinutes: number,
): ComplianceIssue[] {
  const total = weekDrivingMinutes + previousWeekDrivingMinutes
  if (total <= DRIVING.MAX_FORTNIGHTLY_MIN) return []

  return [
    {
      code: COMPLIANCE_ISSUE_CODES.FORTNIGHT_DRIVING_EXCEEDED,
      severity: 'error',
      message: `Zweiwochenlenkzeit ${formatHours(total)} überschreitet 90h`,
      context: { drivingMinutes: total, limitMinutes: DRIVING.MAX_FORTNIGHTLY_MIN },
    },
  ]
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
