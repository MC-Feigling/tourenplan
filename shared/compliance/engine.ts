import type {
  ComplianceValidationResult,
  DriverDayDriving,
  TourComplianceInput,
} from './types'
import { buildTourTimeline, calculateTourWorkMinutes, combineShiftBounds, getTourShiftBounds, mergeDayTimeline } from './timeline'
import { validateDrivingBreaks } from './validators/breaks'
import { validateDailyRest } from './validators/daily-rest'
import { validateWeeklyRest } from './validators/weekly-rest'
import {
  validateDriverAggregates,
  validateFortnightDriving,
  validateTourDailyDriving,
} from './validators/driving-limits'
import { validateDutyTime, validateWorkingTime } from './validators/working-time'
import { COMPLIANCE_ISSUE_CODES } from './constants'
import { addDays, diffMinutes } from '../utils/time'

export function validateTourCompliance(
  tour: TourComplianceInput,
  context?: {
    driverDays?: DriverDayDriving[]
    previousWeekDrivingMinutes?: number
    previousDay?: DriverDayDriving | null
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

  const workMinutes = tour.workMinutes || calculateTourWorkMinutes(tour.stops)
  const tourBounds = getTourShiftBounds(tour.stops)
  const day = context?.driverDays?.find((d) => d.date === tour.date)
  const dayBounds =
    day?.shiftStart && day.shiftEnd ? { start: day.shiftStart, end: day.shiftEnd } : null
  const dutyBounds = combineShiftBounds(dayBounds, tourBounds)
  const dutyMinutes = dutyBounds ? diffMinutes(dutyBounds.start, dutyBounds.end) : workMinutes
  const timeline =
    day?.segments.length && tourBounds
      ? mergeDayTimeline(day.segments, {
          start: tourBounds.start,
          end: tourBounds.end,
          timeline: buildTourTimeline(tour),
        })
      : buildTourTimeline(tour)

  issues.push(...validateDrivingBreaks(timeline, tour.complianceProfile))
  issues.push(...validateWorkingTime(workMinutes, tour.date))
  issues.push(...validateDutyTime(dutyMinutes, tour.date))

  const previousDate = addDays(tour.date, -1)
  const previousFromWeek = context?.driverDays?.find((d) => d.date === previousDate)
  const previousDay = previousFromWeek?.shiftEnd ? previousFromWeek : (context?.previousDay ?? null)
  if (previousDay?.shiftEnd && tourBounds) {
    issues.push(
      ...validateDailyRest(previousDay.date, previousDay.shiftEnd, tour.date, tourBounds.start),
    )
  }

  let dayDrivingMinutes: number | null = null
  let weekDrivingMinutes: number | null = null
  let fortnightDrivingMinutes: number | null = null

  if (context?.driverDays?.length) {
    issues.push(
      ...validateDriverAggregates(tour.date, tour.totalDrivingMinutes, context.driverDays),
    )
    issues.push(
      ...validateWeeklyRest(tour.date, tour.totalDrivingMinutes, context.driverDays),
    )

    const dayBase =
      context.driverDays.find((d) => d.date === tour.date)?.drivingMinutes ?? 0
    dayDrivingMinutes = dayBase + tour.totalDrivingMinutes

    weekDrivingMinutes = context.driverDays.reduce((sum, weekDay) => {
      const extra = weekDay.date === tour.date ? tour.totalDrivingMinutes : 0
      return sum + weekDay.drivingMinutes + extra
    }, 0)

    if (context.previousWeekDrivingMinutes !== undefined) {
      issues.push(
        ...validateFortnightDriving(weekDrivingMinutes, context.previousWeekDrivingMinutes),
      )
      fortnightDrivingMinutes = weekDrivingMinutes + context.previousWeekDrivingMinutes
    }
  } else {
    issues.push(...validateTourDailyDriving(tour.totalDrivingMinutes))
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
