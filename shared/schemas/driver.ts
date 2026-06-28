import { z } from 'zod'
import { TOUR_STATUSES } from '../constants/tours'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const driverToursQuerySchema = z.object({
  from: z.string().regex(dateRegex),
  to: z.string().regex(dateRegex),
})

export const driverStatusUpdateSchema = z.object({
  status: z.enum(TOUR_STATUSES),
})
