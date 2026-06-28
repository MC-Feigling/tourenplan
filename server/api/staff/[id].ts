import { eq } from 'drizzle-orm'
import { leaveRequests, staffMembers } from '../../database/schema'
import { nowEpoch, requireRoles } from '../../utils/access'
import { useDb } from '../../utils/db'
import { toPublicLeave, toPublicStaff } from '../../utils/serializers'
import { staffMemberUpdateSchema } from '../../../shared/schemas/staff'

export default defineEventHandler(async (event) => {
  await requireRoles(event, 'admin')
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const { db } = await useDb()

  if (event.method === 'GET') {
    const [row] = await db.select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Staff member not found' })
    }
    const leave = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.staffMemberId, id))
    return {
      item: toPublicStaff(row),
      leaveRequests: leave.map(toPublicLeave),
    }
  }

  if (event.method === 'PATCH') {
    const body = await readValidatedBody(event, (raw) => staffMemberUpdateSchema.parse(raw))
    const [existing] = await db.select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Staff member not found' })
    }

    await db
      .update(staffMembers)
      .set({
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.jobRole !== undefined ? { jobRole: body.jobRole } : {}),
        ...(body.licenseClasses !== undefined ? { licenseClasses: body.licenseClasses } : {}),
        ...(body.qualifications !== undefined ? { qualifications: body.qualifications } : {}),
        ...(body.employmentType !== undefined ? { employmentType: body.employmentType } : {}),
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.userId !== undefined ? { userId: body.userId } : {}),
        updatedAt: nowEpoch(),
      })
      .where(eq(staffMembers.id, id))

    const [row] = await db.select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1)
    return { item: toPublicStaff(row!) }
  }

  if (event.method === 'DELETE') {
    const [existing] = await db.select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Staff member not found' })
    }
    await db.delete(staffMembers).where(eq(staffMembers.id, id))
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
