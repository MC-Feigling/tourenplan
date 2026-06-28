import { driverStatusUpdateSchema } from '../../../../../shared/schemas/driver'
import { requireDriverStaff } from '../../../../utils/driverAccess'
import { updateDriverTourStatus } from '../../../../utils/driverTourService'
export default defineEventHandler(async (event) => {
  const { staff } = await requireDriverStaff(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const body = await readValidatedBody(event, (raw) => driverStatusUpdateSchema.parse(raw))
  const item = await updateDriverTourStatus(staff.id, id, body.status)
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Tour not found' })
  }

  return { item }
})
