import { requireDispatchWrite } from '../../../utils/access'
import { loadTourWithStops, replaceTourStops } from '../../../utils/tourService'
import { tourStopsReplaceSchema } from '../../../../shared/schemas/tours'
import { nowEpoch } from '../../../utils/access'
import { eq } from 'drizzle-orm'
import { tours } from '../../../database/schema'
import { useDb } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  await requireDispatchWrite(event)
  const tourId = getRouterParam(event, 'id')
  if (!tourId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing tour id' })
  }

  const body = await readValidatedBody(event, (raw) => tourStopsReplaceSchema.parse(raw))
  const existing = await loadTourWithStops(tourId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Tour not found' })
  }

  await replaceTourStops(tourId, body.stops)
  const { db } = await useDb()
  await db.update(tours).set({ updatedAt: nowEpoch() }).where(eq(tours.id, tourId))

  const item = await loadTourWithStops(tourId)
  return { item }
})
