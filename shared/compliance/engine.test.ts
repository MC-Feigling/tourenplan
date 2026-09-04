import { describe, expect, it } from 'vitest'
import { addMinutesToTime } from '../utils/time'
import { getIsoWeekKey, getWeekDates } from './timeline'
import { validateTourCompliance } from './engine'
import type { DriverDayDriving, TourComplianceInput } from './types'

function baseTour(partial?: Partial<TourComplianceInput>): TourComplianceInput {
  return {
    date: '2026-06-30',
    name: 'Test Tour',
    complianceProfile: 'STANDARD_561_2006',
    totalDrivingMinutes: 120,
    workMinutes: 180,
    stops: [
      { plannedArrival: '08:00', plannedDeparture: '08:15', stopType: 'depot', drivingMinutesFromPrev: 0 },
      { plannedArrival: '10:00', plannedDeparture: '10:30', stopType: 'dropoff', drivingMinutesFromPrev: 90 },
      { plannedArrival: '12:00', plannedDeparture: '12:00', stopType: 'depot', drivingMinutesFromPrev: 75 },
    ],
    ...partial,
  }
}

const DRIVE_BLOCK_MIN = 270
const BREAK_MIN = 45

function stopsWithBreaks(totalDrivingMinutes: number, start = '06:00'): TourComplianceInput['stops'] {
  const stops: TourComplianceInput['stops'] = []
  let clock = start
  stops.push({
    plannedArrival: clock,
    plannedDeparture: addMinutesToTime(clock, 10),
    stopType: 'depot',
    drivingMinutesFromPrev: 0,
  })
  clock = addMinutesToTime(clock, 10)

  let remaining = totalDrivingMinutes
  while (remaining > 0) {
    const drive = Math.min(DRIVE_BLOCK_MIN, remaining)
    clock = addMinutesToTime(clock, drive)
    remaining -= drive
    const isLast = remaining === 0
    const dwell = isLast ? 10 : BREAK_MIN
    stops.push({
      plannedArrival: clock,
      plannedDeparture: addMinutesToTime(clock, dwell),
      stopType: isLast ? 'depot' : 'break',
      drivingMinutesFromPrev: drive,
    })
    clock = addMinutesToTime(clock, dwell)
  }

  return stops
}

function weekWithDriving(overrides: Record<string, number>): DriverDayDriving[] {
  const dates = getWeekDates(getIsoWeekKey('2026-06-30'))
  return dates.map((date) => ({
    date,
    drivingMinutes: overrides[date] ?? 0,
    workMinutes: 0,
    tourIds: [],
    shiftStart: null,
    shiftEnd: null,
    segments: [],
  }))
}

describe('validateTourCompliance', () => {
  it('returns ok for compliant short tour', () => {
    const result = validateTourCompliance(baseTour())
    expect(result.status).toBe('ok')
    expect(result.issues).toHaveLength(0)
  })

  it('warns on daily driving over 9h without driver context', () => {
    const result = validateTourCompliance(
      baseTour({
        totalDrivingMinutes: 550,
        workMinutes: 550,
        stops: stopsWithBreaks(550),
      }),
    )
    expect(result.status).toBe('warning')
    expect(result.issues.some((i) => i.code === 'daily_driving_exceeded' && i.severity === 'warning')).toBe(true)
  })

  it('errors when daily driving exceeds 10h', () => {
    const result = validateTourCompliance(
      baseTour({
        totalDrivingMinutes: 601,
        workMinutes: 601,
        stops: stopsWithBreaks(601),
      }),
    )
    expect(result.status).toBe('error')
    expect(result.issues.some((i) => i.code === 'daily_driving_extended_exceeded')).toBe(true)
  })

  it('allows first 10h extension when driver has none this week', () => {
    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 550,
        workMinutes: 550,
        stops: stopsWithBreaks(550),
      }),
      { driverDays: weekWithDriving({ '2026-06-30': 0 }) },
    )
    expect(result.issues.some((i) => i.code === 'daily_driving_exceeded')).toBe(false)
    expect(result.issues.some((i) => i.code === 'daily_driving_extended_exceeded')).toBe(false)
  })

  it('allows second 10h extension in the same week', () => {
    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 550,
        workMinutes: 550,
        stops: stopsWithBreaks(550),
      }),
      {
        driverDays: weekWithDriving({
          '2026-06-29': 550,
          '2026-06-30': 0,
        }),
      },
    )
    expect(result.issues.some((i) => i.code === 'daily_driving_exceeded')).toBe(false)
    expect(result.issues.some((i) => i.code === 'daily_driving_extended_exceeded')).toBe(false)
  })

  it('errors on third 10h extension in the same week', () => {
    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 550,
        workMinutes: 550,
        stops: stopsWithBreaks(550),
      }),
      {
        driverDays: weekWithDriving({
          '2026-06-29': 550,
          '2026-06-30': 0,
          '2026-07-01': 560,
        }),
      },
    )
    expect(result.status).toBe('error')
    expect(result.issues.some((i) => i.code === 'daily_driving_exceeded' && i.severity === 'error')).toBe(true)
  })

  it('flags driving block without 45min break', () => {
    const result = validateTourCompliance(
      baseTour({
        totalDrivingMinutes: 300,
        stops: [
          { plannedArrival: '08:00', plannedDeparture: '08:10', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '13:10', plannedDeparture: '13:15', stopType: 'dropoff', drivingMinutesFromPrev: 300 },
        ],
      }),
    )
    expect(result.issues.some((i) => i.code === 'driving_block_without_break')).toBe(true)
  })

  it('accepts 4.5h block with 45min break', () => {
    const result = validateTourCompliance(
      baseTour({
        totalDrivingMinutes: 300,
        stops: [
          { plannedArrival: '08:00', plannedDeparture: '08:10', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '12:40', plannedDeparture: '13:25', stopType: 'break', drivingMinutesFromPrev: 270 },
          { plannedArrival: '14:00', plannedDeparture: '14:05', stopType: 'dropoff', drivingMinutesFromPrev: 30 },
        ],
      }),
    )
    expect(result.issues.some((i) => i.code === 'driving_block_without_break')).toBe(false)
  })

  it('warns on arbzg work time over 10h', () => {
    const result = validateTourCompliance(
      baseTour({
        workMinutes: 610,
        stops: [
          { plannedArrival: '06:00', plannedDeparture: '06:15', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '16:10', plannedDeparture: '16:15', stopType: 'depot', drivingMinutesFromPrev: 60 },
        ],
      }),
    )
    expect(result.issues.some((i) => i.code === 'daily_work_time_warning')).toBe(true)
    expect(result.issues.some((i) => i.code === 'daily_duty_exceeded')).toBe(false)
  })

  it('errors when tour duty span exceeds 15h', () => {
    const result = validateTourCompliance(
      baseTour({
        totalDrivingMinutes: 60,
        workMinutes: 0,
        stops: [
          { plannedArrival: '05:00', plannedDeparture: '05:10', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '20:30', plannedDeparture: '20:40', stopType: 'depot', drivingMinutesFromPrev: 60 },
        ],
      }),
    )
    expect(result.status).toBe('error')
    expect(result.issues.some((i) => i.code === 'daily_duty_exceeded')).toBe(true)
  })

  it('errors when combined driver-day duty span exceeds 15h', () => {
    const days = weekWithDriving({ '2026-06-30': 120 })
    const target = days.find((d) => d.date === '2026-06-30')
    if (target) {
      target.workMinutes = 360
      target.shiftStart = '05:00'
      target.shiftEnd = '11:00'
    }

    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 60,
        workMinutes: 240,
        stops: [
          { plannedArrival: '18:00', plannedDeparture: '18:10', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '21:50', plannedDeparture: '22:00', stopType: 'depot', drivingMinutesFromPrev: 60 },
        ],
      }),
      { driverDays: days },
    )
    expect(result.status).toBe('error')
    expect(result.issues.some((i) => i.code === 'daily_duty_exceeded')).toBe(true)
  })

  it('errors when rest after previous shift is under 11h', () => {
    const days = weekWithDriving({ '2026-06-29': 180 })
    const previous = days.find((d) => d.date === '2026-06-29')
    if (previous) {
      previous.shiftStart = '08:00'
      previous.shiftEnd = '21:00'
    }

    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 90,
        workMinutes: 130,
        stops: [
          { plannedArrival: '06:00', plannedDeparture: '06:10', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '08:00', plannedDeparture: '08:10', stopType: 'depot', drivingMinutesFromPrev: 90 },
        ],
      }),
      { driverDays: days },
    )
    expect(result.status).toBe('error')
    expect(result.issues.some((i) => i.code === 'insufficient_daily_rest')).toBe(true)
  })

  it('accepts 11h rest between consecutive shifts', () => {
    const days = weekWithDriving({ '2026-06-29': 180 })
    const previous = days.find((d) => d.date === '2026-06-29')
    if (previous) {
      previous.shiftStart = '08:00'
      previous.shiftEnd = '18:00'
    }

    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 90,
        workMinutes: 130,
        stops: [
          { plannedArrival: '06:00', plannedDeparture: '06:10', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '08:00', plannedDeparture: '08:10', stopType: 'depot', drivingMinutesFromPrev: 90 },
        ],
      }),
      { driverDays: days },
    )
    expect(result.issues.some((i) => i.code === 'insufficient_daily_rest')).toBe(false)
  })

  it('errors on seventh driving day in the ISO week', () => {
    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 90,
        workMinutes: 130,
        stops: [
          { plannedArrival: '08:00', plannedDeparture: '08:10', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '10:00', plannedDeparture: '10:10', stopType: 'depot', drivingMinutesFromPrev: 90 },
        ],
      }),
      {
        driverDays: weekWithDriving({
          '2026-06-29': 60,
          '2026-06-30': 0,
          '2026-07-01': 60,
          '2026-07-02': 60,
          '2026-07-03': 60,
          '2026-07-04': 60,
          '2026-07-05': 60,
        }),
      },
    )
    expect(result.status).toBe('error')
    expect(result.issues.some((i) => i.code === 'weekly_rest_missing')).toBe(true)
  })

  it('allows sixth driving day in the ISO week', () => {
    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 90,
        workMinutes: 130,
        stops: [
          { plannedArrival: '08:00', plannedDeparture: '08:10', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '10:00', plannedDeparture: '10:10', stopType: 'depot', drivingMinutesFromPrev: 90 },
        ],
      }),
      {
        driverDays: weekWithDriving({
          '2026-06-29': 60,
          '2026-06-30': 0,
          '2026-07-01': 60,
          '2026-07-02': 60,
          '2026-07-03': 60,
          '2026-07-04': 60,
          '2026-07-05': 0,
        }),
      },
    )
    expect(result.issues.some((i) => i.code === 'weekly_rest_missing')).toBe(false)
  })

  it('flags driving block across two tours on the same day', () => {
    const days = weekWithDriving({ '2026-06-30': 180 })
    const day = days.find((d) => d.date === '2026-06-30')
    if (day) {
      day.shiftStart = '08:00'
      day.shiftEnd = '11:00'
      day.segments = [
        {
          start: '08:00',
          end: '11:00',
          timeline: [{ type: 'drive', minutes: 180 }],
        },
      ]
    }

    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 180,
        workMinutes: 190,
        stops: [
          { plannedArrival: '11:10', plannedDeparture: '11:15', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '14:15', plannedDeparture: '14:20', stopType: 'depot', drivingMinutesFromPrev: 180 },
        ],
      }),
      { driverDays: days },
    )
    expect(result.issues.some((i) => i.code === 'driving_block_without_break')).toBe(true)
  })

  it('treats gap between same-day tours as break', () => {
    const days = weekWithDriving({ '2026-06-30': 180 })
    const day = days.find((d) => d.date === '2026-06-30')
    if (day) {
      day.shiftStart = '08:00'
      day.shiftEnd = '11:00'
      day.segments = [
        {
          start: '08:00',
          end: '11:00',
          timeline: [{ type: 'drive', minutes: 180 }],
        },
      ]
    }

    const result = validateTourCompliance(
      baseTour({
        date: '2026-06-30',
        totalDrivingMinutes: 180,
        workMinutes: 190,
        stops: [
          { plannedArrival: '11:45', plannedDeparture: '11:50', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '14:50', plannedDeparture: '14:55', stopType: 'depot', drivingMinutesFromPrev: 180 },
        ],
      }),
      { driverDays: days },
    )
    expect(result.issues.some((i) => i.code === 'driving_block_without_break')).toBe(false)
  })
})
