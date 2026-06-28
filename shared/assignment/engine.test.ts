import { describe, expect, it } from 'vitest'
import { validateAssignment } from './engine'
import type { AssignmentValidationContext } from './types'

const baseContext: AssignmentValidationContext = {
  drivers: [
    {
      id: 'd1',
      fullName: 'Max Mustermann',
      active: true,
      licenseClasses: ['D'],
      onLeave: false,
    },
  ],
  vehicles: [
    {
      id: 'v1',
      name: 'Bus 1',
      plateNumber: 'M-AB 100',
      status: 'available',
    },
  ],
  otherTours: [],
}

describe('validateAssignment', () => {
  it('warns when driver and vehicle are missing', () => {
    const result = validateAssignment(
      {
        date: '2026-06-28',
        driverId: null,
        vehicleId: null,
        stops: [{ plannedArrival: '08:00', plannedDeparture: '12:00' }],
      },
      baseContext,
    )

    expect(result.status).toBe('warning')
    expect(result.issues).toHaveLength(2)
  })

  it('detects driver double booking', () => {
    const result = validateAssignment(
      {
        tourId: 't-new',
        date: '2026-06-28',
        driverId: 'd1',
        vehicleId: 'v1',
        stops: [{ plannedArrival: '09:00', plannedDeparture: '11:00' }],
      },
      {
        ...baseContext,
        otherTours: [
          {
            id: 't-existing',
            name: 'Linie 12',
            date: '2026-06-28',
            driverId: 'd1',
            vehicleId: 'v1',
            windowStart: 8 * 60,
            windowEnd: 10 * 60,
          },
        ],
      },
    )

    expect(result.status).toBe('error')
    expect(result.issues.some((issue) => issue.code === 'DRIVER_DOUBLE_BOOKED')).toBe(true)
    expect(result.issues.some((issue) => issue.code === 'VEHICLE_DOUBLE_BOOKED')).toBe(true)
  })

  it('flags inactive driver and unavailable vehicle', () => {
    const result = validateAssignment(
      {
        date: '2026-06-28',
        driverId: 'd1',
        vehicleId: 'v1',
        stops: [{ plannedArrival: '08:00', plannedDeparture: '10:00' }],
      },
      {
        drivers: [{ ...baseContext.drivers[0]!, active: false, onLeave: true, leaveTypeLabel: 'Urlaub' }],
        vehicles: [{ ...baseContext.vehicles[0]!, status: 'maintenance' }],
        otherTours: [],
      },
    )

    expect(result.status).toBe('error')
    expect(result.issues.some((issue) => issue.code === 'DRIVER_INACTIVE')).toBe(true)
    expect(result.issues.some((issue) => issue.code === 'DRIVER_ON_LEAVE')).toBe(true)
    expect(result.issues.some((issue) => issue.code === 'VEHICLE_UNAVAILABLE')).toBe(true)
  })

  it('returns ok for valid assignment', () => {
    const result = validateAssignment(
      {
        date: '2026-06-28',
        driverId: 'd1',
        vehicleId: 'v1',
        stops: [{ plannedArrival: '08:00', plannedDeparture: '12:00' }],
      },
      baseContext,
    )

    expect(result.status).toBe('ok')
    expect(result.issues).toHaveLength(0)
  })
})
