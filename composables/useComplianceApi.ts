import type { ComplianceValidationResult } from '~/shared/compliance/types'
import { resolveComplianceProfile } from '~/shared/constants/compliance'
import type { TourFormState } from '~/composables/useToursApi'
import { extractError } from '~/shared/utils/apiError'

export function useComplianceApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function validateTour(
    form: TourFormState,
    options?: { tourId?: string; driverId?: string | null },
  ) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      const lineLengthKm =
        form.type === 'line' && form.lineLengthKm ? Number(form.lineLengthKm) : null
      const complianceProfile = resolveComplianceProfile(form.type, lineLengthKm)

      return await apiFetch<{ result: ComplianceValidationResult }>('/api/compliance/validate', {
        method: 'POST',
        body: {
          tourId: options?.tourId,
          driverId: options?.driverId ?? null,
          draft: {
            date: form.date,
            name: form.name,
            type: form.type,
            lineLengthKm,
            complianceProfile,
            stops: form.stops.map((s) => ({
              plannedArrival: s.plannedArrival,
              plannedDeparture: s.plannedDeparture,
              stopType: s.stopType,
              drivingMinutesFromPrev: s.drivingMinutesFromPrev,
            })),
          },
        },
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e, 'Validierung fehlgeschlagen')
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, validateTour }
}
