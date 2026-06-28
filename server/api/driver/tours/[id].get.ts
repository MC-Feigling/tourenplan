import { requireDriverStaff } from '../../../utils/driverAccess'
import { loadDriverTour } from '../../../utils/driverTourService'

export default defineEventHandler(async (event) => {
  const { staff } = await requireDriverStaff(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const item = await loadDriverTour(staff.id, id)
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Tour not found' })
  }

  return { item }
})
