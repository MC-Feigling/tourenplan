import { eq } from 'drizzle-orm'
import { lineTemplates } from '../../database/schema'
import { nowEpoch, requireDispatchRead, requireDispatchWrite } from '../../utils/access'
import { useDb } from '../../utils/db'
import { toPublicLineTemplate } from '../../utils/tourHelpers'
import { lineTemplateUpdateSchema } from '../../../shared/schemas/tours'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const { db } = await useDb()

  if (event.method === 'GET') {
    await requireDispatchRead(event)
    const [row] = await db.select().from(lineTemplates).where(eq(lineTemplates.id, id)).limit(1)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Line template not found' })
    }
    return { item: toPublicLineTemplate(row) }
  }

  if (event.method === 'PATCH') {
    await requireDispatchWrite(event)
    const body = await readValidatedBody(event, (raw) => lineTemplateUpdateSchema.parse(raw))
    const [existing] = await db.select().from(lineTemplates).where(eq(lineTemplates.id, id)).limit(1)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Line template not found' })
    }

    await db
      .update(lineTemplates)
      .set({
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.lineLengthKm !== undefined ? { lineLengthKm: body.lineLengthKm } : {}),
        ...(body.weekdays !== undefined ? { weekdays: body.weekdays } : {}),
        ...(body.defaultDepartureTime !== undefined
          ? { defaultDepartureTime: body.defaultDepartureTime }
          : {}),
        ...(body.defaultStops !== undefined ? { defaultStops: body.defaultStops } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        updatedAt: nowEpoch(),
      })
      .where(eq(lineTemplates.id, id))

    const [row] = await db.select().from(lineTemplates).where(eq(lineTemplates.id, id)).limit(1)
    return { item: toPublicLineTemplate(row!) }
  }

  if (event.method === 'DELETE') {
    await requireDispatchWrite(event)
    const [existing] = await db.select().from(lineTemplates).where(eq(lineTemplates.id, id)).limit(1)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Line template not found' })
    }
    await db.delete(lineTemplates).where(eq(lineTemplates.id, id))
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
