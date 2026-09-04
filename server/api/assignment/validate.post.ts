import { resolveComplianceProfile } from '../../../shared/constants/compliance'
import { mergeOverallStatus } from '../../../shared/assignment/engine'
import { assignmentValidateSchema } from '../../../shared/schemas/assignment'
import { validateTourCompliance } from '../../../shared/compliance/engine'
import { requireDispatchRead } from '../../utils/access'
import { validateTourAssignment } from '../../utils/assignmentService'
import {
  draftToComplianceInput,
  loadDriverWeekDriving,
  publicTourToComplianceInput,
} from '../../utils/complianceService'
import { loadTourWithStops } from '../../utils/tourService'

export default defineEventHandler(async (event) => {
  await requireDispatchRead(event)
  const body = await readValidatedBody(event, (raw) => assignmentValidateSchema.parse(raw))

  const assignment = await validateTourAssignment({
    tourId: body.tourId,
    date: body.date,
    driverId: body.driverId ?? null,
    vehicleId: body.vehicleId ?? null,
    stops: body.stops,
  })

  if (!body.includeCompliance) {
    return {
      assignment,
      compliance: null,
      overallStatus: assignment.status,
    }
  }

  const driverId = body.driverId ?? null
  let compliance = null

  if (body.tourId) {
    const tour = await loadTourWithStops(body.tourId)
    if (tour) {
      const input = publicTourToComplianceInput(tour)
      let context
      if (driverId) {
        const weekContext = await loadDriverWeekDriving(driverId, input.date, body.tourId)
        context = {
          driverDays: weekContext.weekDays,
          previousWeekDrivingMinutes: weekContext.previousWeekDrivingMinutes,
          previousDay: weekContext.previousDay,
        }
      }
      compliance = validateTourCompliance(input, context)
    }
  } else if (body.draft) {
    const lineLengthKm = body.draft.type === 'line' ? (body.draft.lineLengthKm ?? null) : null
    const complianceProfile =
      body.draft.complianceProfile ?? resolveComplianceProfile(body.draft.type, lineLengthKm)
    const stops = body.draft.stops ?? body.stops.map((stop, index) => ({
      plannedArrival: stop.plannedArrival,
      plannedDeparture: stop.plannedDeparture,
      stopType: stop.stopType ?? (index === 0 ? 'depot' : 'pickup'),
      drivingMinutesFromPrev: stop.drivingMinutesFromPrev ?? 0,
    }))

    const input = draftToComplianceInput({
      date: body.date,
      name: body.draft.name,
      complianceProfile,
      stops,
    })

    let context
    if (driverId) {
      const weekContext = await loadDriverWeekDriving(driverId, body.date)
      context = {
        driverDays: weekContext.weekDays,
        previousWeekDrivingMinutes: weekContext.previousWeekDrivingMinutes,
        previousDay: weekContext.previousDay,
      }
    }
    compliance = validateTourCompliance(input, context)
  }

  return {
    assignment,
    compliance,
    overallStatus: mergeOverallStatus(assignment.status, compliance?.status ?? 'ok'),
  }
})
