<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

const auth = useAuthStore()
const email = ref('')
const password = ref('')

const { data: setupStatus } = await useFetch<{ hasUsers: boolean }>('/api/auth/setup-status')
const showBootstrapHint = computed(() => setupStatus.value && !setupStatus.value.hasUsers)

async function onSubmit() {
  const ok = await auth.login(email.value, password.value)
  if (!ok) return
  await navigateTo(auth.homePath)
}

useHead({ title: 'Anmelden' })
</script>

<template>
  <div class="w-full max-w-sm space-y-8">
    <div class="space-y-2 text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/15 ring-1 ring-brand-500/30">
        <svg class="h-7 w-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      </div>
      <h1 class="font-display text-3xl font-bold tracking-tight text-white">
        Touren<span class="text-brand-400">plan</span>
      </h1>
      <p class="text-sm text-slate-400">Tourenplanung für Busunternehmen</p>
    </div>

    <div class="surface-card space-y-5 p-6">
      <div
        v-if="showBootstrapHint"
        class="rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-xs text-brand-200"
        role="status"
      >
        <p class="font-semibold">Erstes Setup</p>
        <p class="mt-1 text-brand-300/80">
          Melde dich mit <code class="rounded bg-black/20 px-1">admin@localhost.local</code> an.
        </p>
      </div>

      <div
        v-if="auth.error"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        role="alert"
      >
        {{ auth.error }}
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-400" for="email">E-Mail</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="name@firma.de"
            class="input-field"
          >
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-slate-400" for="password">Passwort</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="input-field"
          >
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          {{ auth.loading ? 'Anmelden…' : 'Anmelden' }}
        </button>
      </form>
    </div>
  </div>
</template>
