import { describe, expect, it } from 'vitest'
import { validateTourCompliance } from './engine'
import type { TourComplianceInput } from './types'

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

describe('validateTourCompliance', () => {
  it('returns ok for compliant short tour', () => {
    const result = validateTourCompliance(baseTour())
    expect(result.status).toBe('ok')
    expect(result.issues).toHaveLength(0)
  })

  it('flags daily driving over 9h', () => {
    const result = validateTourCompliance(
      baseTour({
        totalDrivingMinutes: 550,
        stops: [
          { plannedArrival: '06:00', plannedDeparture: '06:15', stopType: 'depot', drivingMinutesFromPrev: 0 },
          { plannedArrival: '15:30', plannedDeparture: '16:00', stopType: 'dropoff', drivingMinutesFromPrev: 550 },
        ],
      }),
    )
    expect(result.status).toBe('error')
    expect(result.issues.some((i) => i.code === 'daily_driving_exceeded')).toBe(true)
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
  })
})
