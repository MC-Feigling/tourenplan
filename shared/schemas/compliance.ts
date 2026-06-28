import { z } from 'zod'
import { COMPLIANCE_PROFILES } from '../constants/compliance'
import { STOP_TYPES } from '../constants/tours'

const stopSchema = z.object({
  plannedArrival: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  plannedDeparture: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  stopType: z.enum(STOP_TYPES),
  drivingMinutesFromPrev: z.number().int().min(0).max(1440),
})

export const complianceValidateSchema = z
  .object({
    tourId: z.string().optional(),
    driverId: z.string().nullable().optional(),
    draft: z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        name: z.string().trim().min(1),
        complianceProfile: z.enum(COMPLIANCE_PROFILES),
        type: z.enum(['line', 'excursion']).optional(),
        lineLengthKm: z.number().nullable().optional(),
        stops: z.array(stopSchema).min(1),
      })
      .optional(),
  })
  .refine((value) => Boolean(value.tourId || value.draft), {
    message: 'tourId or draft required',
    path: ['draft'],
  })
