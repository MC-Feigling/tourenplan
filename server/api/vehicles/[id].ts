import { eq } from 'drizzle-orm'
import { vehicles } from '../../database/schema'
import { nowEpoch, requireRoles } from '../../utils/access'
import { useDb } from '../../utils/db'
import { toPublicVehicle } from '../../utils/serializers'
import { vehicleUpdateSchema } from '../../../shared/schemas/staff'

export default defineEventHandler(async (event) => {
  await requireRoles(event, 'admin')
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const { db } = await useDb()

  if (event.method === 'GET') {
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
    }
    return { item: toPublicVehicle(row) }
  }

  if (event.method === 'PATCH') {
    const body = await readValidatedBody(event, (raw) => vehicleUpdateSchema.parse(raw))
    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
    }

    if (body.plateNumber) {
      const plate = body.plateNumber.toUpperCase()
      const [duplicate] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.plateNumber, plate))
        .limit(1)
      if (duplicate && duplicate.id !== id) {
        throw createError({ statusCode: 409, statusMessage: 'Plate number already exists' })
      }
    }

    await db
      .update(vehicles)
      .set({
        ...(body.plateNumber !== undefined ? { plateNumber: body.plateNumber.toUpperCase() } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.seats !== undefined ? { seats: body.seats } : {}),
        ...(body.vehicleClass !== undefined ? { vehicleClass: body.vehicleClass } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.features !== undefined ? { features: body.features } : {}),
        ...(body.tachoType !== undefined ? { tachoType: body.tachoType } : {}),
        ...(body.nextInspectionDate !== undefined
          ? { nextInspectionDate: body.nextInspectionDate }
          : {}),
        ...(body.nextMaintenanceKm !== undefined
          ? { nextMaintenanceKm: body.nextMaintenanceKm }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        updatedAt: nowEpoch(),
      })
      .where(eq(vehicles.id, id))

    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)
    return { item: toPublicVehicle(row!) }
  }

  if (event.method === 'DELETE') {
    const [existing] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)
    if (!existing) {
      throw createError({ statusCode: 404, statusMessage: 'Vehicle not found' })
    }
    await db.delete(vehicles).where(eq(vehicles.id, id))
    return { ok: true }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
