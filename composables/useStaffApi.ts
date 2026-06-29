import type { PublicStaffMember, PublicLeaveRequest } from '~/shared/types/staff'
import type { StaffJobRole, LicenseClass, StaffQualification, EmploymentType, LeaveType } from '~/shared/constants/staff'

export type StaffFormState = {
  firstName: string
  lastName: string
  phone: string
  email: string
  jobRole: StaffJobRole
  licenseClasses: LicenseClass[]
  qualifications: StaffQualification[]
  employmentType: EmploymentType
  active: boolean
}

export type LeaveFormState = {
  startDate: string
  endDate: string
  type: LeaveType
  note: string
}

export function emptyStaffForm(): StaffFormState {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    jobRole: 'driver',
    licenseClasses: ['D'],
    qualifications: [],
    employmentType: 'full',
    active: true,
  }
}

export function staffToForm(item: PublicStaffMember): StaffFormState {
  return {
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    email: item.email,
    jobRole: item.jobRole,
    licenseClasses: [...item.licenseClasses],
    qualifications: [...item.qualifications],
    employmentType: item.employmentType,
    active: item.active,
  }
}

export function emptyLeaveForm(): LeaveFormState {
  const today = new Date().toISOString().slice(0, 10)
  return {
    startDate: today,
    endDate: today,
    type: 'vacation',
    note: '',
  }
}

export function useStaffApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function list() {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ items: PublicStaffMember[] }>('/api/staff', { credentials: 'include' })
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
      return await apiFetch<{ item: PublicStaffMember; leaveRequests: PublicLeaveRequest[] }>(
        `/api/staff/${id}`,
        { credentials: 'include' },
      )
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload: StaffFormState) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ item: PublicStaffMember }>('/api/staff', {
        method: 'POST',
        body: payload,
        credentials: 'include',
      })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id: string, payload: Partial<StaffFormState>) {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      return await apiFetch<{ item: PublicStaffMember }>(`/api/staff/${id}`, {
        method: 'PATCH',
        body: payload,
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
      await apiFetch(`/api/staff/${id}`, { method: 'DELETE', credentials: 'include' })
    } catch (e: unknown) {
      error.value = extractError(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addLeave(staffId: string, payload: LeaveFormState) {
    const apiFetch = useApiFetch()
    return await apiFetch<{ item: PublicLeaveRequest }>(`/api/staff/${staffId}/leave`, {
      method: 'POST',
      body: payload,
      credentials: 'include',
    })
  }

  async function removeLeave(id: string) {
    const apiFetch = useApiFetch()
    await apiFetch(`/api/leave/${id}`, { method: 'DELETE', credentials: 'include' })
  }

  return { loading, error, list, get, create, update, remove, addLeave, removeLeave }
}

function extractError(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return err.data?.statusMessage ?? err.message ?? 'Unbekannter Fehler'
}
