import { z } from 'zod'
import { COMPLIANCE_PROFILES } from '../constants/compliance'
import { STOP_TYPES, TOUR_TYPES } from '../constants/tours'
import { tourStopInputSchema } from './tours'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const assignmentResourcesQuerySchema = z.object({
  from: z.string().regex(dateRegex),
  to: z.string().regex(dateRegex),
})

const complianceStopSchema = z.object({
  plannedArrival: tourStopInputSchema.shape.plannedArrival,
  plannedDeparture: tourStopInputSchema.shape.plannedDeparture,
  stopType: z.enum(STOP_TYPES),
  drivingMinutesFromPrev: z.number().int().min(0).max(1440),
})

export const assignmentValidateSchema = z.object({
  tourId: z.string().optional(),
  date: z.string().regex(dateRegex),
  driverId: z.string().nullable().optional(),
  vehicleId: z.string().nullable().optional(),
  stops: z.array(
    z.object({
      plannedArrival: tourStopInputSchema.shape.plannedArrival,
      plannedDeparture: tourStopInputSchema.shape.plannedDeparture,
      stopType: z.enum(STOP_TYPES).optional(),
      drivingMinutesFromPrev: z.number().int().min(0).max(1440).optional(),
    }),
  ).min(1),
  includeCompliance: z.boolean().optional().default(true),
  draft: z
    .object({
      name: z.string().trim().min(1),
      type: z.enum(TOUR_TYPES),
      lineLengthKm: z.number().nullable().optional(),
      complianceProfile: z.enum(COMPLIANCE_PROFILES).optional(),
      stops: z.array(complianceStopSchema).min(1).optional(),
    })
    .optional(),
})
