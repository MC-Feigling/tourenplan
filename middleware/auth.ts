import type { UserRole } from '~/shared/constants/roles'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  if (!auth.user) {
    await auth.fetchMe()
  }
  if (!auth.user) {
    return navigateTo('/login')
  }

  const requiredRoles = to.meta.roles as UserRole[] | undefined
  if (requiredRoles?.length && !auth.hasRole(...requiredRoles)) {
    return navigateTo(auth.homePath)
  }
})
