<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  roles: ['admin'],
})

useHead({ title: 'Administration' })
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader
      title="Administration"
      description="Stammdaten und Nutzerverwaltung"
    />

    <div class="grid gap-4 sm:grid-cols-2">
      <NuxtLink to="/admin/vehicles" class="surface-card group block p-5 no-underline transition-colors hover:border-brand-500/30">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold text-white group-hover:text-brand-300">Fuhrpark</h2>
            <p class="mt-2 text-sm text-slate-400">Fahrzeuge anlegen und verwalten</p>
          </div>
          <span class="rounded-lg bg-brand-500/10 px-2 py-1 text-xs text-brand-400">→</span>
        </div>
      </NuxtLink>

      <NuxtLink to="/admin/staff" class="surface-card group block p-5 no-underline transition-colors hover:border-brand-500/30">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold text-white group-hover:text-brand-300">Mitarbeiter</h2>
            <p class="mt-2 text-sm text-slate-400">Fahrer, Disponenten, Abwesenheit</p>
          </div>
          <span class="rounded-lg bg-brand-500/10 px-2 py-1 text-xs text-brand-400">→</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
