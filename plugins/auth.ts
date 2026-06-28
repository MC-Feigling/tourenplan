export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  await callOnce('auth:init', () => auth.fetchMe())
})
