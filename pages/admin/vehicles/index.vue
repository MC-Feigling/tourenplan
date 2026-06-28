<script setup lang="ts">
import { VEHICLE_CLASS_LABELS } from '~/shared/constants/vehicles'
import type { PublicVehicle } from '~/shared/types/staff'

definePageMeta({
  middleware: 'auth',
  roles: ['admin'],
})

const api = useVehiclesApi()
const items = ref<PublicVehicle[]>([])
const loadError = ref<string | null>(null)

async function load() {
  loadError.value = null
  try {
    const res = await api.list()
    items.value = res.items
  } catch {
    loadError.value = api.error.value
  }
}

await load()

useHead({ title: 'Fuhrpark' })
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader title="Fuhrpark" description="Busse und Fahrzeuge verwalten">
      <template #actions>
        <NuxtLink to="/admin/vehicles/new" class="btn-primary no-underline">
          + Neu
        </NuxtLink>
      </template>
    </AdminPageHeader>

    <div
      v-if="loadError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {{ loadError }}
    </div>

    <UiEmptyState
      v-if="!api.loading && items.length === 0"
      title="Noch keine Fahrzeuge"
      description="Lege das erste Fahrzeug im Fuhrpark an."
    >
      <template #icon>
        <svg class="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      </template>
      <template #action>
        <NuxtLink to="/admin/vehicles/new" class="btn-primary no-underline">Fahrzeug anlegen</NuxtLink>
      </template>
    </UiEmptyState>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="vehicle in items"
        :key="vehicle.id"
        :to="`/admin/vehicles/${vehicle.id}`"
        class="surface-card block p-4 no-underline transition-colors hover:border-brand-500/30"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate font-semibold text-white">{{ vehicle.name }}</p>
            <p class="mt-0.5 font-mono text-sm text-brand-400">{{ vehicle.plateNumber }}</p>
          </div>
          <AdminVehicleStatusBadge :status="vehicle.status" small />
        </div>
        <p class="mt-3 text-xs text-slate-500">
          {{ VEHICLE_CLASS_LABELS[vehicle.vehicleClass] }} · {{ vehicle.seats }} Sitze
        </p>
      </NuxtLink>
    </div>
  </div>
</template>
