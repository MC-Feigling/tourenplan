import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { staffMembers, type StaffMemberRow } from '../database/schema'
import { requireRoles } from './access'
import { useDb } from './db'
import type { UserRow } from '../database/schema'

export async function getStaffForUserId(userId: string): Promise<StaffMemberRow | null> {
  const { db } = await useDb()
  const [row] = await db
    .select()
    .from(staffMembers)
    .where(eq(staffMembers.userId, userId))
    .limit(1)
  return row ?? null
}

export async function requireDriverStaff(
  event: H3Event,
): Promise<{ user: UserRow; staff: StaffMemberRow }> {
  const user = await requireRoles(event, 'driver')
  const staff = await getStaffForUserId(user.id)
  if (!staff) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Kein Mitarbeiterprofil mit diesem Konto verknüpft',
    })
  }
  if (!staff.active) {
    throw createError({ statusCode: 403, statusMessage: 'Mitarbeiterprofil ist inaktiv' })
  }
  return { user, staff }
}
