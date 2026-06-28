<script setup lang="ts">
const auth = useAuthStore()
await callOnce('auth:init', () => auth.fetchMe())

if (auth.user) {
  await navigateTo(auth.homePath)
} else {
  await navigateTo('/login')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <p class="text-slate-400 text-sm">Laden…</p>
  </div>
</template>
