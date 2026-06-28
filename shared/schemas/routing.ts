import { z } from 'zod'
import { DEFAULT_ROUTING_PROFILE, ORS_ROUTING_PROFILES } from '../constants/routing'

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(3).max(200),
})

export const directionsBodySchema = z.object({
  profile: z.enum(ORS_ROUTING_PROFILES).default(DEFAULT_ROUTING_PROFILE),
  coordinates: z
    .array(
      z.object({
        lng: z.number().min(-180).max(180),
        lat: z.number().min(-90).max(90),
      }),
    )
    .min(2)
    .max(25),
})

export type DirectionsCoordinate = z.infer<typeof directionsBodySchema>['coordinates'][number]
