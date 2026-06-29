import type { UserRole } from '~/shared/constants/roles'
import { defineStore } from 'pinia'
import type { PublicUser } from '~/shared/types/auth'
import { ROLE_HOME_PATH } from '~/shared/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  const homePath = computed(() => {
    if (!user.value) return '/login'
    return ROLE_HOME_PATH[user.value.role]
  })

  async function fetchMe() {
    const apiFetch = useApiFetch()
    loading.value = true
    error.value = null
    try {
      const res = await apiFetch<{ user: PublicUser | null }>('/api/auth/me', {
        credentials: 'include',
      })
      user.value = res.user
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<{ user: PublicUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
        credentials: 'include',
      })
      user.value = res.user
      return true
    } catch (e: unknown) {
      const err = e as { data?: { statusMessage?: string } }
      error.value = err.data?.statusMessage ?? 'Login fehlgeschlagen'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    const apiFetch = useApiFetch()
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      user.value = null
      if (import.meta.client) await navigateTo('/login')
    }
  }

  function hasRole(...roles: UserRole[]) {
    return user.value !== null && roles.includes(user.value.role)
  }

  return { user, loading, error, isAuthenticated, homePath, fetchMe, login, logout, hasRole }
})
