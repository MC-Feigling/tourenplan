<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest',
})

const auth = useAuthStore()
const email = ref('')
const password = ref('')

const { data: setupStatus } = await useFetch<{ setupAvailable: boolean }>('/api/auth/setup-status')
const showBootstrapHint = computed(() => setupStatus.value?.setupAvailable === true)

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

    <UCard
      variant="subtle"
      :ui="{
        root: 'rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-sm shadow-xl ring-0',
        body: 'space-y-5 p-6 sm:p-6',
      }"
    >
      <UAlert
        v-if="showBootstrapHint"
        color="primary"
        variant="subtle"
        title="Erstes Setup"
        role="status"
      >
        <template #description>
          Erstes Setup: Zugangsdaten aus der Server-Konfiguration verwenden.
        </template>
      </UAlert>

      <UAlert
        v-if="auth.error"
        color="error"
        variant="subtle"
        :title="auth.error"
        role="alert"
      />

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="E-Mail" name="email" size="md">
          <UInput
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="name@firma.de"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Passwort" name="password" size="md">
          <UInput
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          block
          color="primary"
          size="lg"
          :loading="auth.loading"
        >
          Anmelden
        </UButton>
      </form>
    </UCard>
  </div>
</template>
