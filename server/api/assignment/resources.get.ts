import { requireDispatchRead } from '../../utils/access'
import { loadAssignmentResources } from '../../utils/assignmentService'
import { assignmentResourcesQuerySchema } from '../../../shared/schemas/assignment'

export default defineEventHandler(async (event) => {
  await requireDispatchRead(event)
  const query = await getValidatedQuery(event, (raw) => assignmentResourcesQuerySchema.parse(raw))
  return loadAssignmentResources(query.from, query.to)
})
