import { getQuery } from 'h3'
import { driverToursQuerySchema } from '../../../../shared/schemas/driver'
import { requireDriverStaff } from '../../../utils/driverAccess'
import { listDriverTours } from '../../../utils/driverTourService'

export default defineEventHandler(async (event) => {
  const { staff } = await requireDriverStaff(event)
  const query = driverToursQuerySchema.parse(getQuery(event))
  const items = await listDriverTours(staff.id, query.from, query.to)
  return { items }
})
