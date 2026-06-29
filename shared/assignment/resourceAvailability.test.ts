import { describe, expect, it } from 'vitest'
import {
  getDriverAvailabilityForDate,
  getResourceOverviewForDate,
  getVehicleAvailabilityForDate,
} from './resourceAvailability'
import type { AssignmentResources } from './weekSummary'
import type { PublicTour } from '../types/tours'

const resources: AssignmentResources = {
  drivers: [
    {
      id: 'd1',
      fullName: 'Max Mustermann',
      active: true,
      licenseClasses: ['D'],
      onLeave: false,
    },
    {
      id: 'd2',
      fullName: 'Erika Muster',
      active: true,
      licenseClasses: ['D'],
      onLeave: false,
    },
    {
      id: 'd3',
      fullName: 'Inaktiv User',
      active: false,
      licenseClasses: ['D'],
      onLeave: false,
    },
  ],
  vehicles: [
    { id: 'v1', name: 'Bus 1', plateNumber: 'M-AB 100', status: 'available' },
    { id: 'v2', name: 'Bus 2', plateNumber: 'M-AB 200', status: 'maintenance' },
  ],
  leaveRequests: [
    {
      id: 'l1',
      staffMemberId: 'd2',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      type: 'vacation',
      note: '',
      createdAt: 0,
    },
  ],
}

const tours: PublicTour[] = [
  {
    id: 't1',
    depotId: null,
    type: 'excursion',
    name: 'Ausflug A',
    date: '2026-06-28',
    status: 'draft',
    driverId: 'd1',
    vehicleId: 'v1',
    lineLengthKm: null,
    lineTemplateId: null,
    complianceProfile: 'STANDARD_561_2006',
    notes: '',
    totalDrivingMinutes: 120,
    createdAt: 0,
    updatedAt: 0,
    stops: [
      {
        id: 's1',
        tourId: 't1',
        sequence: 0,
        locationName: 'Start',
        address: '',
        lat: null,
        lng: null,
        plannedArrival: '08:00',
        plannedDeparture: '12:00',
        stopType: 'depot',
        drivingMinutesFromPrev: 0,
      },
    ],
  },
]

describe('resourceAvailability', () => {
  it('marks assigned driver on date', () => {
    const result = getDriverAvailabilityForDate(resources.drivers[0]!, '2026-06-28', tours)
    expect(result.availability).toBe('assigned')
    expect(result.assignedTourNames).toEqual(['Ausflug A'])
  })

  it('marks free driver on date without assignment', () => {
    const result = getDriverAvailabilityForDate(resources.drivers[0]!, '2026-06-29', tours)
    expect(result.availability).toBe('available')
  })

  it('blocks driver on leave', () => {
    const driverOnLeave = {
      ...resources.drivers[1]!,
      onLeave: true,
      leaveTypeLabel: 'Urlaub',
    }
    const result = getDriverAvailabilityForDate(driverOnLeave, '2026-06-28', tours)
    expect(result.availability).toBe('blocked')
    expect(result.blockReason).toContain('abwesend')
  })

  it('blocks inactive driver', () => {
    const result = getDriverAvailabilityForDate(resources.drivers[2]!, '2026-06-28', tours)
    expect(result.availability).toBe('blocked')
    expect(result.blockReason).toBe('inaktiv')
  })

  it('blocks vehicle in maintenance', () => {
    const result = getVehicleAvailabilityForDate(resources.vehicles[1]!, '2026-06-28', tours)
    expect(result.availability).toBe('blocked')
    expect(result.blockReason).toBe('Werkstatt')
  })

  it('counts available resources for date', () => {
    const overview = getResourceOverviewForDate(resources, tours, '2026-06-28')
    expect(overview.availableDriverCount).toBe(0)
    expect(overview.availableVehicleCount).toBe(0)
    expect(overview.drivers.find((d) => d.id === 'd1')?.availability).toBe('assigned')
  })
})
