import type { PublicVehicle } from '~/shared/types/staff'
import type { VehicleClass, VehicleStatus, TachoType, VehicleFeature } from '~/shared/constants/vehicles'

export type VehicleFormState = {
  plateNumber: string
  name: string
  seats: number
  vehicleClass: VehicleClass
  status: VehicleStatus
  features: VehicleFeature[]
  tachoType: TachoType
  nextInspectionDate: string
  nextMaintenanceKm: string
  notes: string
}

export function emptyVehicleForm(): VehicleFormState {
  return {
    plateNumber: '',
    name: '',
    seats: 49,
    vehicleClass: 'coach',
    status: 'available',
    features: [],
    tachoType: 'digital',
    nextInspectionDate: '',
    nextMaintenanceKm: '',
    notes: '',
  }
}

export function vehicleToForm(item: PublicVehicle): VehicleFormState {
  return {
    plateNumber: item.plateNumber,
    name: item.name,
    seats: item.seats,
    vehicleClass: item.vehicleClass,
    status: item.status,
    features: [...item.features],
    tachoType: item.tachoType,
    nextInspectionDate: item.nextInspectionDate ?? '',
    nextMaintenanceKm: item.nextMaintenanceKm?.toString() ?? '',
    notes: item.notes,
  }
}

export function formToVehiclePayload(form: VehicleFormState) {
  return {
    plateNumber: form.plateNumber,
    name: form.name,
    seats: form.seats,
    vehicleClass: form.vehicleClass,
    status: form.status,
    features: form.features,
    tachoType: form.tachoType,
    nextInspectionDate: form.nextInspectionDate || null,
    nextMaintenanceKm: form.nextMaintenanceKm ? Number(form.nextMaintenanceKm) : null,
    notes: form.notes,
  }
}

export function useVehiclesApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function list() {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ items: PublicVehicle[] }>('/api/vehicles', { credentials: 'include' })
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
      return await apiFetch<{ item: PublicVehicle }>(`/api/vehicles/${id}`, {
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(form: VehicleFormState) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ item: PublicVehicle }>('/api/vehicles', {
        method: 'POST',
        body: formToVehiclePayload(form),
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, form: VehicleFormState) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ item: PublicVehicle }>(`/api/vehicles/${id}`, {
        method: 'PATCH',
        body: formToVehiclePayload(form),
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
    loading.value = true
    error.value = null
    try {
      await apiFetch(`/api/vehicles/${id}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, list, get, create, update, remove }
}

function extractError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return err.data?.statusMessage ?? err.message ?? 'Unbekannter Fehler'
}
