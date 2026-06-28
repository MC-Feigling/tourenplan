import { getQuery } from 'h3'
import { requireDispatchRead } from '../../utils/access'
import { geocodeAddress } from '../../services/orsClient'
import { geocodeQuerySchema } from '../../../shared/schemas/routing'

export default defineEventHandler(async (event) => {
  await requireDispatchRead(event)
  const { q } = geocodeQuerySchema.parse(getQuery(event))
  const items = await geocodeAddress(q)
  return { items }
})
