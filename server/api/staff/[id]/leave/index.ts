import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { leaveRequests, staffMembers } from '../../../../database/schema'
import { nowEpoch, requireRoles } from '../../../../utils/access'
import { useDb } from '../../../../utils/db'
import { toPublicLeave } from '../../../../utils/serializers'
import { leaveRequestSchema } from '../../../../../shared/schemas/staff'

export default defineEventHandler(async (event) => {
  await requireRoles(event, 'admin')
  const staffId = getRouterParam(event, 'id')
  if (!staffId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing staff id' })
  }

  const { db } = await useDb()
  const [staff] = await db.select().from(staffMembers).where(eq(staffMembers.id, staffId)).limit(1)
  if (!staff) {
    throw createError({ statusCode: 404, statusMessage: 'Staff member not found' })
  }

  if (event.method === 'GET') {
    const rows = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.staffMemberId, staffId))
    return { items: rows.map(toPublicLeave) }
  }

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, (raw) => leaveRequestSchema.parse(raw))
    const id = nanoid()
    const now = nowEpoch()

    await db.insert(leaveRequests).values({
      id,
      staffMemberId: staffId,
      startDate: body.startDate,
      endDate: body.endDate,
      type: body.type,
      note: body.note ?? '',
      createdAt: now,
    })

    const [row] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1)
    return { item: toPublicLeave(row!) }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
