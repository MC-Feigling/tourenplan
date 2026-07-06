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
      <NuxtLink to="/admin/vehicles" class="group block no-underline">
        <UiAppCard body-class="p-5 transition-colors group-hover:border-brand-500/30">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold text-white group-hover:text-brand-300">Fuhrpark</h2>
              <p class="mt-2 text-sm text-slate-400">Fahrzeuge anlegen und verwalten</p>
            </div>
            <UBadge color="primary" variant="subtle">→</UBadge>
          </div>
        </UiAppCard>
      </NuxtLink>

      <NuxtLink to="/admin/staff" class="group block no-underline">
        <UiAppCard body-class="p-5 transition-colors group-hover:border-brand-500/30">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold text-white group-hover:text-brand-300">Mitarbeiter</h2>
              <p class="mt-2 text-sm text-slate-400">Fahrer, Disponenten, Abwesenheit</p>
            </div>
            <UBadge color="primary" variant="subtle">→</UBadge>
          </div>
        </UiAppCard>
      </NuxtLink>
    </div>
  </div>
</template>
