import { eq } from 'drizzle-orm'
import { tours } from '../../database/schema'
import { nowEpoch, requireDispatchRead, requireDispatchWrite } from '../../utils/access'
import { useDb } from '../../utils/db'
import { loadTourWithStops, propagateLineTourWeekUpdates } from '../../utils/tourService'
import { resolveTourCompliance } from '../../utils/tourHelpers'
import { tourUpdateSchema } from '../../../shared/schemas/tours'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  if (event.method === 'GET') {
    await requireDispatchRead(event)
    const item = await loadTourWithStops(id)
    if (!item) {
      throw createError({ statusCode: 404, statusMessage: 'Tour not found' })
    }
    return { item }
  }

  if (event.method === 'PATCH') {
    await requireDispatchWrite(event)
    const body = await readValidatedBody(event, (raw) => tourUpdateSchema.parse(raw))
    const { db } = await useDb()
    const [existing] = await db.select().from(tours).where(eq(tours.id, id)).limit(1)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Tour not found' })
    }

    const nextType = body.type ?? existing.type
    const nextLineLengthKm =
      body.lineLengthKm !== undefined
        ? body.lineLengthKm
        : existing.lineLengthKm
    const complianceProfile = resolveTourCompliance(
      nextType as 'line' | 'excursion',
      nextLineLengthKm,
    )

    await db
      .update(tours)
      .set({
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.date !== undefined ? { date: body.date } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.lineLengthKm !== undefined ? { lineLengthKm: body.lineLengthKm } : {}),
        ...(body.lineTemplateId !== undefined ? { lineTemplateId: body.lineTemplateId } : {}),
        ...(body.vehicleId !== undefined ? { vehicleId: body.vehicleId } : {}),
        ...(body.driverId !== undefined ? { driverId: body.driverId } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        complianceProfile,
        updatedAt: nowEpoch(),
      })
      .where(eq(tours.id, id))

    const lineTemplateId = existing.lineTemplateId
    if (existing.type === 'line' && lineTemplateId && body.status !== undefined) {
      await propagateLineTourWeekUpdates(
        id,
        lineTemplateId,
        body.date ?? existing.date,
        { status: body.status },
      )
    }

    const item = await loadTourWithStops(id)
    return { item }
  }

  if (event.method === 'DELETE') {
    await requireDispatchWrite(event)
    const { db } = await useDb()
    const [existing] = await db.select().from(tours).where(eq(tours.id, id)).limit(1)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Tour not found' })
    }
    await db.delete(tours).where(eq(tours.id, id))
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
