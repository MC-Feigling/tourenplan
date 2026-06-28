import { getQuery } from 'h3'
import { z } from 'zod'
import { requireDispatchRead, requireDispatchWrite } from '../../utils/access'
import { createTourRecord, listToursInRange } from '../../utils/tourService'
import { tourCreateSchema } from '../../../shared/schemas/tours'

const rangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    await requireDispatchRead(event)
    const query = rangeQuerySchema.parse(getQuery(event))
    const items = await listToursInRange(query.from, query.to)
    return { items }
  }

  if (event.method === 'POST') {
    await requireDispatchWrite(event)
    const body = await readValidatedBody(event, (raw) => tourCreateSchema.parse(raw))
    const item = await createTourRecord(body)
    if (!item) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create tour' })
    }
    return { item }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
