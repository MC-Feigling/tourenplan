import { requireDispatchRead } from '../../utils/access'
import { fetchDirections } from '../../services/orsClient'
import { directionsBodySchema } from '../../../shared/schemas/routing'

export default defineEventHandler(async (event) => {
  await requireDispatchRead(event)
  const body = await readValidatedBody(event, (raw) => directionsBodySchema.parse(raw))
  const result = await fetchDirections(body.coordinates, body.profile)
  return { result }
})
