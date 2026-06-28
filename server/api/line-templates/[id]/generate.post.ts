import { and, eq } from 'drizzle-orm'
import { lineTemplates, tours } from '../../../database/schema'
import { requireDispatchWrite } from '../../../utils/access'
import { useDb } from '../../../utils/db'
import {
  buildStopsFromTemplate,
  createTourRecord,
} from '../../../utils/tourService'
import { datesBetween, isoWeekdayFromDate } from '../../../utils/tourHelpers'
import { generateToursSchema } from '../../../../shared/schemas/tours'

export default defineEventHandler(async (event) => {
  await requireDispatchWrite(event)
  const templateId = getRouterParam(event, 'id')
  if (!templateId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing template id' })
  }

  const body = await readValidatedBody(event, (raw) => generateToursSchema.parse(raw))
  const { db } = await useDb()
  const [template] = await db
    .select()
    .from(lineTemplates)
    .where(eq(lineTemplates.id, templateId))
    .limit(1)

  if (!template) {
    throw createError({ statusCode: 404, statusMessage: 'Line template not found' })
  }

  if (!template.active) {
    throw createError({ statusCode: 400, statusMessage: 'Line template is inactive' })
  }

  const publicTemplate = template
  const weekdays = Array.isArray(publicTemplate.weekdays)
    ? publicTemplate.weekdays.filter((d): d is number => typeof d === 'number')
    : []
  const defaultStops = Array.isArray(publicTemplate.defaultStops)
    ? (publicTemplate.defaultStops as Array<{
        locationName: string
        address: string
        stopType: string
        offsetMinutesFromStart: number
        dwellMinutes: number
        drivingMinutesFromPrev: number
      }>)
    : []

  const created = []
  const skipped = []

  for (const date of datesBetween(body.from, body.to)) {
    const weekday = isoWeekdayFromDate(date)
    if (!weekdays.includes(weekday)) {
      skipped.push({ date, reason: 'weekday' })
      continue
    }

    const [existing] = await db
      .select()
      .from(tours)
      .where(and(eq(tours.lineTemplateId, templateId), eq(tours.date, date)))
      .limit(1)

    if (existing) {
      skipped.push({ date, reason: 'exists' })
      continue
    }

    const stops = buildStopsFromTemplate(template.defaultDepartureTime, defaultStops)
    const item = await createTourRecord({
      type: 'line',
      name: template.name,
      date,
      status: 'draft',
      lineLengthKm: template.lineLengthKm,
      lineTemplateId: templateId,
      notes: '',
      stops,
    })

    if (item) created.push(item)
  }

  return { created, skipped, count: created.length }
})
