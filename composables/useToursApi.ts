import type { PublicLineTemplate, PublicTour, PublicTourStop } from '~/shared/types/tours'
import type { TourType, TourStatus, StopType } from '~/shared/constants/tours'

export type TourStopFormRow = {
  locationName: string
  address: string
  lat: number | null
  lng: number | null
  plannedArrival: string
  plannedDeparture: string
  stopType: StopType
  drivingMinutesFromPrev: number
}

export type TourFormState = {
  type: TourType
  name: string
  date: string
  status: TourStatus
  lineLengthKm: string
  driverId: string
  vehicleId: string
  notes: string
  stops: TourStopFormRow[]
}

export function emptyStop(partial?: Partial<TourStopFormRow>): TourStopFormRow {
  return {
    locationName: '',
    address: '',
    lat: null,
    lng: null,
    plannedArrival: '08:00',
    plannedDeparture: '08:05',
    stopType: 'pickup',
    drivingMinutesFromPrev: 0,
    ...partial,
  }
}

export function emptyTourForm(date: string, type: TourType = 'excursion'): TourFormState {
  return {
    type,
    name: '',
    date,
    status: 'draft',
    lineLengthKm: type === 'line' ? '30' : '',
    driverId: '',
    vehicleId: '',
    notes: '',
    stops: [
      emptyStop({ locationName: 'Betriebshof', stopType: 'depot', plannedArrival: '08:00', plannedDeparture: '08:15' }),
      emptyStop({ locationName: 'Ziel', stopType: 'dropoff', plannedArrival: '10:00', plannedDeparture: '10:30', drivingMinutesFromPrev: 90 }),
      emptyStop({ locationName: 'Betriebshof', stopType: 'depot', plannedArrival: '12:00', plannedDeparture: '12:00', drivingMinutesFromPrev: 90 }),
    ],
  }
}

export function tourToForm(tour: PublicTour): TourFormState {
  return {
    type: tour.type,
    name: tour.name,
    date: tour.date,
    status: tour.status,
    lineLengthKm: tour.lineLengthKm?.toString() ?? '',
    driverId: tour.driverId ?? '',
    vehicleId: tour.vehicleId ?? '',
    notes: tour.notes,
    stops: tour.stops.map((s) => ({
      locationName: s.locationName,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      plannedArrival: s.plannedArrival,
      plannedDeparture: s.plannedDeparture,
      stopType: s.stopType,
      drivingMinutesFromPrev: s.drivingMinutesFromPrev,
    })),
  }
}

export function formToTourPayload(form: TourFormState) {
  return {
    type: form.type,
    name: form.name,
    date: form.date,
    status: form.status,
    lineLengthKm: form.type === 'line' ? Number(form.lineLengthKm) : null,
    driverId: form.driverId || null,
    vehicleId: form.vehicleId || null,
    notes: form.notes,
    stops: form.stops,
  }
}

export function useToursApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function listRange(from: string, to: string) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ items: PublicTour[] }>('/api/tours', {
        query: { from, to },
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function get(id: string) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ item: PublicTour }>(`/api/tours/${id}`, { credentials: 'include' })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(form: TourFormState) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ item: PublicTour }>('/api/tours', {
        method: 'POST',
        body: formToTourPayload(form),
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, form: Partial<TourFormState>) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      const body: Record<string, unknown> = {}
      if (form.type !== undefined) body.type = form.type
      if (form.name !== undefined) body.name = form.name
      if (form.date !== undefined) body.date = form.date
      if (form.status !== undefined) body.status = form.status
      if (form.lineLengthKm !== undefined) {
        body.lineLengthKm = form.type === 'line' || form.lineLengthKm ? Number(form.lineLengthKm) : null
      }
      if (form.driverId !== undefined) body.driverId = form.driverId || null
      if (form.vehicleId !== undefined) body.vehicleId = form.vehicleId || null
      if (form.notes !== undefined) body.notes = form.notes
      return await apiFetch<{ item: PublicTour }>(`/api/tours/${id}`, {
        method: 'PATCH',
        body,
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function saveStops(id: string, stops: TourStopFormRow[]) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ item: PublicTour }>(`/api/tours/${id}/stops`, {
        method: 'PUT',
        body: { stops },
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    const apiFetch = useApiFetch()
    await apiFetch(`/api/tours/${id}`, { method: 'DELETE', credentials: 'include' })
  }

  async function listLineTemplates() {
    const apiFetch = useApiFetch()
    return await apiFetch<{ items: PublicLineTemplate[] }>('/api/line-templates', {
      credentials: 'include',
    })
  }

  async function generateFromTemplate(templateId: string, from: string, to: string) {
    const apiFetch = useApiFetch()
    return await apiFetch<{ created: PublicTour[]; count: number }>(
      `/api/line-templates/${templateId}/generate`,
      { method: 'POST', body: { from, to }, credentials: 'include' },
    )
  }

  return {
    loading,
    error,
    listRange,
    get,
    create,
    update,
    saveStops,
    remove,
    listLineTemplates,
    generateFromTemplate,
  }
}

function extractError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return err.data?.statusMessage ?? err.message ?? 'Unbekannter Fehler'
}
