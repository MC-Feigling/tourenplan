import { asc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { staffMembers } from '../../database/schema'
import { getDefaultDepotId, nowEpoch, requireDispatchRead, requireRoles } from '../../utils/access'
import { useDb } from '../../utils/db'
import { toPublicStaff } from '../../utils/serializers'
import { staffMemberSchema } from '../../../shared/schemas/staff'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    await requireDispatchRead(event)
    const { db } = await useDb()
    const rows = await db
      .select()
      .from(staffMembers)
      .orderBy(asc(staffMembers.lastName), asc(staffMembers.firstName))
    return { items: rows.map(toPublicStaff) }
  }

  await requireRoles(event, 'admin')

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, (raw) => staffMemberSchema.parse(raw))
    const { db } = await useDb()
    const depotId = await getDefaultDepotId()
    const now = nowEpoch()
    const id = nanoid()

    await db.insert(staffMembers).values({
      id,
      depotId,
      userId: body.userId ?? null,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone ?? '',
      email: body.email ?? '',
      jobRole: body.jobRole,
      licenseClasses: body.licenseClasses,
      qualifications: body.qualifications,
      employmentType: body.employmentType,
      active: body.active,
      createdAt: now,
      updatedAt: now,
    })

    const [row] = await db.select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1)
    if (!row) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create staff member' })
    }
    return { item: toPublicStaff(row) }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
