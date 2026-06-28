import { z } from 'zod'
import { STOP_TYPES, TOUR_STATUSES, TOUR_TYPES } from '../constants/tours'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const tourStopInputSchema = z.object({
  locationName: z.string().trim().min(1).max(128),
  address: z.string().trim().max(256).optional().default(''),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  plannedArrival: z.string().regex(timeRegex),
  plannedDeparture: z.string().regex(timeRegex),
  stopType: z.enum(STOP_TYPES),
  drivingMinutesFromPrev: z.number().int().min(0).max(1440).default(0),
})

export const tourCreateSchema = z.object({
  type: z.enum(TOUR_TYPES),
  name: z.string().trim().min(1).max(128),
  date: z.string().regex(dateRegex),
  status: z.enum(TOUR_STATUSES).default('draft'),
  lineLengthKm: z.number().min(0).max(500).nullable().optional(),
  lineTemplateId: z.string().nullable().optional(),
  vehicleId: z.string().nullable().optional(),
  driverId: z.string().nullable().optional(),
  notes: z.string().trim().max(1000).optional().default(''),
  stops: z.array(tourStopInputSchema).min(1).optional(),
})

export const tourUpdateSchema = tourCreateSchema.partial().omit({ stops: true })

export const tourStopsReplaceSchema = z.object({
  stops: z.array(tourStopInputSchema).min(1),
})

export const lineTemplateStopSchema = z.object({
  locationName: z.string().trim().min(1).max(128),
  address: z.string().trim().max(256).optional().default(''),
  stopType: z.enum(STOP_TYPES),
  offsetMinutesFromStart: z.number().int().min(0).max(1440),
  dwellMinutes: z.number().int().min(0).max(480).default(5),
  drivingMinutesFromPrev: z.number().int().min(0).max(1440).default(0),
})

export const lineTemplateSchema = z.object({
  name: z.string().trim().min(1).max(128),
  lineLengthKm: z.number().min(0).max(500),
  weekdays: z.array(z.number().int().min(1).max(7)).min(1),
  defaultDepartureTime: z.string().regex(timeRegex),
  defaultStops: z.array(lineTemplateStopSchema).min(2),
  active: z.boolean().default(true),
})

export const lineTemplateUpdateSchema = lineTemplateSchema.partial()

export const generateToursSchema = z.object({
  from: z.string().regex(dateRegex),
  to: z.string().regex(dateRegex),
}).refine((v) => v.to >= v.from, { message: 'End date must be on or after start date', path: ['to'] })
