import { asc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { lineTemplates } from '../../database/schema'
import { getDefaultDepotId, nowEpoch, requireDispatchRead, requireDispatchWrite } from '../../utils/access'
import { useDb } from '../../utils/db'
import { toPublicLineTemplate } from '../../utils/tourHelpers'
import { lineTemplateSchema } from '../../../shared/schemas/tours'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    await requireDispatchRead(event)
    const { db } = await useDb()
    const rows = await db.select().from(lineTemplates).orderBy(asc(lineTemplates.name))
    return { items: rows.map(toPublicLineTemplate) }
  }

  if (event.method === 'POST') {
    await requireDispatchWrite(event)
    const body = await readValidatedBody(event, (raw) => lineTemplateSchema.parse(raw))
    const { db } = await useDb()
    const depotId = await getDefaultDepotId()
    const now = nowEpoch()
    const id = nanoid()

    await db.insert(lineTemplates).values({
      id,
      depotId,
      name: body.name,
      lineLengthKm: body.lineLengthKm,
      weekdays: body.weekdays,
      defaultDepartureTime: body.defaultDepartureTime,
      defaultStops: body.defaultStops,
      active: body.active,
      createdAt: now,
      updatedAt: now,
    })

    const [row] = await db.select().from(lineTemplates).where(eq(lineTemplates.id, id)).limit(1)
    return { item: toPublicLineTemplate(row!) }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
