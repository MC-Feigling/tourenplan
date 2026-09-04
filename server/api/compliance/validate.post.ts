import { resolveComplianceProfile } from '../../../shared/constants/compliance'
import { validateTourCompliance } from '../../../shared/compliance/engine'
import { requireDispatchRead } from '../../utils/access'
import {
  draftToComplianceInput,
  loadDriverWeekDriving,
  publicTourToComplianceInput,
} from '../../utils/complianceService'
import { loadTourWithStops } from '../../utils/tourService'
import { complianceValidateSchema } from '../../../shared/schemas/compliance'

export default defineEventHandler(async (event) => {
  await requireDispatchRead(event)
  const body = await readValidatedBody(event, (raw) => complianceValidateSchema.parse(raw))

  let input
  let tourId = body.tourId

  if (body.draft) {
    const profile =
      body.draft.complianceProfile ??
      resolveComplianceProfile(
        body.draft.type ?? 'excursion',
        body.draft.lineLengthKm ?? null,
      )
    input = draftToComplianceInput({ ...body.draft, complianceProfile: profile })
    tourId = body.tourId
  } else if (body.tourId) {
    const tour = await loadTourWithStops(body.tourId)
    if (!tour) {
      throw createError({ statusCode: 404, statusMessage: 'Tour not found' })
    }
    input = publicTourToComplianceInput(tour)
    if (body.driverId !== undefined) {
      input = { ...input }
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request' })
  }

  const driverId = body.driverId ?? null
  let context

  if (driverId) {
    const weekContext = await loadDriverWeekDriving(driverId, input.date, tourId)
    context = {
      driverDays: weekContext.weekDays,
      previousWeekDrivingMinutes: weekContext.previousWeekDrivingMinutes,
      previousDay: weekContext.previousDay,
    }
  }

  const result = validateTourCompliance(input, context)
  return { result }
})
