import type { DriverTour } from '~/shared/types/driver'
import type { TourStatus } from '~/shared/constants/tours'
import {
  DRIVER_STATUS_ACTION_LABELS,
  DRIVER_STATUS_TRANSITIONS,
} from '~/shared/constants/driver'

export function useDriverApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function listRange(from: string, to: string) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<{ items: DriverTour[] }>('/api/driver/tours', {
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
    loading.value = true
    error.value = null
    try {
      return await $fetch<{ item: DriverTour }>(`/api/driver/tours/${id}`, {
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateStatus(id: string, status: TourStatus) {
    loading.value = true
    error.value = null
    try {
      return await $fetch<{ item: DriverTour }>(`/api/driver/tours/${id}/status`, {
        method: 'PATCH',
        body: { status },
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  function nextStatus(current: TourStatus): TourStatus | null {
    const options = DRIVER_STATUS_TRANSITIONS[current] ?? []
    return options[0] ?? null
  }

  function statusActionLabel(current: TourStatus): string | null {
    return DRIVER_STATUS_ACTION_LABELS[current] ?? null
  }

  return { loading, error, listRange, get, updateStatus, nextStatus, statusActionLabel }
}

function extractError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return err.data?.statusMessage ?? err.message ?? 'Unbekannter Fehler'
}
