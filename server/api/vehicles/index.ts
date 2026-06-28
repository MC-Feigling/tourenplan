import { asc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { vehicles } from '../../database/schema'
import { getDefaultDepotId, nowEpoch, requireDispatchRead, requireRoles } from '../../utils/access'
import { useDb } from '../../utils/db'
import { toPublicVehicle } from '../../utils/serializers'
import { vehicleSchema } from '../../../shared/schemas/staff'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    await requireDispatchRead(event)
    const { db } = await useDb()
    const rows = await db.select().from(vehicles).orderBy(asc(vehicles.name))
    return { items: rows.map(toPublicVehicle) }
  }

  await requireRoles(event, 'admin')

  if (event.method === 'POST') {
    const body = await readValidatedBody(event, (raw) => vehicleSchema.parse(raw))
    const { db } = await useDb()
    const depotId = await getDefaultDepotId()
    const now = nowEpoch()
    const id = nanoid()

    const [duplicate] = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.plateNumber, body.plateNumber.toUpperCase()))
      .limit(1)
    if (duplicate) {
      throw createError({ statusCode: 409, statusMessage: 'Plate number already exists' })
    }

    await db.insert(vehicles).values({
      id,
      depotId,
      plateNumber: body.plateNumber.toUpperCase(),
      name: body.name,
      seats: body.seats,
      vehicleClass: body.vehicleClass,
      status: body.status,
      features: body.features,
      tachoType: body.tachoType,
      nextInspectionDate: body.nextInspectionDate ?? null,
      nextMaintenanceKm: body.nextMaintenanceKm ?? null,
      notes: body.notes ?? '',
      createdAt: now,
      updatedAt: now,
    })

    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1)
    return { item: toPublicVehicle(row!) }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
