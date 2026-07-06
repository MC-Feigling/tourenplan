<script setup lang="ts">
const auth = useAuthStore()

async function onLogout() {
  await auth.logout()
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-white/8 bg-base/90 backdrop-blur-md">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
      <NuxtLink :to="auth.user?.role === 'driver' ? '/driver' : '/'" class="flex items-center gap-2.5 no-underline">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/25">
          <svg class="h-4 w-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
        </div>
        <span class="font-display text-lg font-bold text-white">
          Touren<span class="text-brand-400">plan</span>
        </span>
      </NuxtLink>

      <nav v-if="auth.user" class="hidden items-center gap-1 md:flex">
        <NuxtLink
          v-if="auth.hasRole('driver')"
          to="/driver"
          class="rounded-lg px-3 py-2 text-sm text-slate-300 no-underline transition-colors hover:bg-white/5 hover:text-white"
          active-class="!bg-white/10 !text-white"
        >
          Meine Touren
        </NuxtLink>
        <NuxtLink
          v-if="auth.hasRole('admin', 'dispatcher', 'viewer')"
          to="/dispatcher"
          class="rounded-lg px-3 py-2 text-sm text-slate-300 no-underline transition-colors hover:bg-white/5 hover:text-white"
          active-class="!bg-white/10 !text-white"
        >
          Disposition
        </NuxtLink>
        <NuxtLink
          v-if="auth.hasRole('admin')"
          to="/admin"
          class="rounded-lg px-3 py-2 text-sm text-slate-300 no-underline transition-colors hover:bg-white/5 hover:text-white"
          active-class="!bg-white/10 !text-white"
        >
          Admin
        </NuxtLink>
      </nav>

      <div v-if="auth.user" class="flex items-center gap-3">
        <span class="hidden text-xs text-slate-400 sm:block">{{ auth.user.displayName }}</span>
        <UButton variant="ghost" color="neutral" size="xs" @click="onLogout">
          Abmelden
        </UButton>
      </div>
    </div>
  </header>
</template>
