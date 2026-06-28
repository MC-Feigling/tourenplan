import type {
  ComplianceValidationResult,
  DriverDayDriving,
  TourComplianceInput,
} from './types'
import { buildTourTimeline, calculateTourWorkMinutes } from './timeline'
import { validateDrivingBreaks } from './validators/breaks'
import {
  validateDriverAggregates,
  validateFortnightDriving,
  validateTourDailyDriving,
} from './validators/driving-limits'
import { validateWorkingTime } from './validators/working-time'
import { COMPLIANCE_ISSUE_CODES } from './constants'

export function validateTourCompliance(
  tour: TourComplianceInput,
  context?: {
    driverDays?: DriverDayDriving[]
    previousWeekDrivingMinutes?: number
  },
): ComplianceValidationResult {
  const issues = []

  if (tour.stops.length === 0) {
    issues.push({
      code: COMPLIANCE_ISSUE_CODES.TOUR_NO_STOPS,
      severity: 'error' as const,
      message: 'Tour ohne Haltestellen',
    })
  }

  const timeline = buildTourTimeline(tour)
  const workMinutes = tour.workMinutes || calculateTourWorkMinutes(tour.stops)

  issues.push(...validateTourDailyDriving(tour.totalDrivingMinutes))
  issues.push(...validateDrivingBreaks(timeline, tour.complianceProfile))
  issues.push(...validateWorkingTime(workMinutes, tour.date))

  let dayDrivingMinutes: number | null = null
  let weekDrivingMinutes: number | null = null
  let fortnightDrivingMinutes: number | null = null

  if (context?.driverDays?.length) {
    issues.push(
      ...validateDriverAggregates(tour.date, tour.totalDrivingMinutes, context.driverDays),
    )

    const dayBase =
      context.driverDays.find((d) => d.date === tour.date)?.drivingMinutes ?? 0
    dayDrivingMinutes = dayBase + tour.totalDrivingMinutes

    weekDrivingMinutes = context.driverDays.reduce((sum, day) => {
      const extra = day.date === tour.date ? tour.totalDrivingMinutes : 0
      return sum + day.drivingMinutes + extra
    }, 0)

    if (context.previousWeekDrivingMinutes !== undefined) {
      issues.push(
        ...validateFortnightDriving(weekDrivingMinutes, context.previousWeekDrivingMinutes),
      )
      fortnightDrivingMinutes = weekDrivingMinutes + context.previousWeekDrivingMinutes
    }
  }

  const status = issues.some((i) => i.severity === 'error')
    ? 'error'
    : issues.some((i) => i.severity === 'warning')
      ? 'warning'
      : 'ok'

  return {
    status,
    issues,
    summary: {
      tourDrivingMinutes: tour.totalDrivingMinutes,
      tourWorkMinutes: workMinutes,
      dayDrivingMinutes,
      weekDrivingMinutes,
      fortnightDrivingMinutes,
    },
  }
}

export function mergeComplianceStatus(
  results: ComplianceValidationResult[],
): ComplianceValidationResult['status'] {
  if (results.some((r) => r.status === 'error')) return 'error'
  if (results.some((r) => r.status === 'warning')) return 'warning'
  return 'ok'
}
