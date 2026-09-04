import { describe, expect, it } from 'vitest'
import { aggregateWeekConflicts } from './weekConflicts'
import type { AssignmentResources } from './weekSummary'
import type { PublicTour } from '../types/tours'

function stop(overrides: Partial<PublicTour['stops'][0]> = {}): PublicTour['stops'][0] {
  return {
    id: 's1',
    tourId: 't1',
    sequence: 0,
    locationName: 'A',
    address: '',
    lat: null,
    lng: null,
    plannedArrival: '08:00',
    plannedDeparture: '08:10',
    stopType: 'pickup',
    drivingMinutesFromPrev: 0,
    ...overrides,
  }
}

function tour(overrides: Partial<PublicTour> & { id: string; date: string }): PublicTour {
  return {
    depotId: null,
    type: 'excursion',
    name: overrides.name ?? overrides.id,
    status: 'assigned',
    complianceProfile: 'STANDARD_561_2006',
    lineLengthKm: null,
    lineTemplateId: null,
    vehicleId: null,
    driverId: null,
    notes: '',
    totalDrivingMinutes: 0,
    stops: [stop({ tourId: overrides.id }), stop({ id: 's2', tourId: overrides.id, sequence: 1, plannedArrival: '10:00', plannedDeparture: '10:10' })],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

const resources: AssignmentResources = {
  drivers: [
    {
      id: 'd1',
      fullName: 'Max',
      active: true,
      licenseClasses: ['D'],
      onLeave: false,
    },
  ],
  vehicles: [
    {
      id: 'v1',
      plateNumber: 'B-TP 1',
      name: 'Bus',
      status: 'available',
    },
  ],
  leaveRequests: [],
}

describe('aggregateWeekConflicts', () => {
  it('returns empty when no resources', () => {
    expect(aggregateWeekConflicts([tour({ id: 't1', date: '2026-09-01' })], null)).toEqual({
      count: 0,
      dates: [],
      tourIds: [],
    })
  })

  it('counts tours with double-booked driver as conflicts', () => {
    const a = tour({
      id: 't1',
      date: '2026-09-01',
      name: 'A',
      driverId: 'd1',
      vehicleId: 'v1',
    })
    const b = tour({
      id: 't2',
      date: '2026-09-01',
      name: 'B',
      driverId: 'd1',
      vehicleId: null,
      stops: [
        stop({ id: 'b1', tourId: 't2', plannedArrival: '08:30', plannedDeparture: '08:40' }),
        stop({ id: 'b2', tourId: 't2', sequence: 1, plannedArrival: '09:30', plannedDeparture: '09:40' }),
      ],
    })
    const result = aggregateWeekConflicts([a, b], resources)
    expect(result.count).toBeGreaterThanOrEqual(1)
    expect(result.tourIds.length).toBeGreaterThanOrEqual(1)
    expect(result.dates).toContain('2026-09-01')
  })

  it('ignores ok tours', () => {
    const alone = tour({
      id: 't1',
      date: '2026-09-02',
      driverId: 'd1',
      vehicleId: 'v1',
    })
    const result = aggregateWeekConflicts([alone], resources)
    expect(result.count).toBe(0)
    expect(result.tourIds).toEqual([])
  })
})
