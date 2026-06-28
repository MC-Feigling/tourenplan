<script setup lang="ts">
import { COMPLIANCE_PROFILE_LABELS } from '~/shared/constants/compliance'
import { TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
import { minutesToRoundedHours } from '~/shared/utils/time'
import type { DriverTour } from '~/shared/types/driver'
import type { TourStopFormRow } from '~/composables/useToursApi'

definePageMeta({
  layout: 'driver',
  middleware: 'auth',
  roles: ['driver'],
})

const route = useRoute()
const api = useDriverApi()

const id = computed(() => route.params.id as string)
const tour = ref<DriverTour | null>(null)
const loadError = ref<string | null>(null)
const actionError = ref<string | null>(null)
const acting = ref(false)

try {
  const res = await api.get(id.value)
  tour.value = res.item
} catch {
  loadError.value = api.error.value
}

const pageTitle = computed(() => tour.value?.name ?? 'Tour')
const nextStatus = computed(() => (tour.value ? api.nextStatus(tour.value.status) : null))
const actionLabel = computed(() => (tour.value ? api.statusActionLabel(tour.value.status) : null))
const mapStops = computed<TourStopFormRow[]>(() =>
  (tour.value?.stops ?? []).map((stop) => ({
    locationName: stop.locationName,
    address: stop.address,
    lat: stop.lat,
    lng: stop.lng,
    plannedArrival: stop.plannedArrival,
    plannedDeparture: stop.plannedDeparture,
    stopType: stop.stopType,
    drivingMinutesFromPrev: stop.drivingMinutesFromPrev,
  })),
)

useHead({ title: pageTitle })

async function onStatusAction() {
  if (!tour.value || !nextStatus.value) return
  actionError.value = null
  acting.value = true
  try {
    const res = await api.updateStatus(tour.value.id, nextStatus.value)
    tour.value = res.item
  } catch {
    actionError.value = api.error.value
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="space-y-3">
      <NuxtLink to="/driver" class="inline-flex text-sm text-brand-400 no-underline hover:text-brand-300">
        ← Meine Touren
      </NuxtLink>
      <div v-if="tour">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="font-display text-xl font-bold text-white">{{ tour.name }}</h1>
            <p class="mt-1 text-sm text-slate-400">
              {{ new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${tour.date}T12:00:00`)) }}
              · {{ TOUR_TYPE_LABELS[tour.type] }}
            </p>
          </div>
          <span class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
            {{ TOUR_STATUS_LABELS[tour.status] }}
          </span>
        </div>
      </div>
    </header>

    <div
      v-if="loadError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {{ loadError }}
    </div>

    <template v-else-if="tour">
      <div
        v-if="actionError"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        role="alert"
      >
        {{ actionError }}
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="surface-card p-4">
          <p class="text-[10px] uppercase tracking-wide text-slate-500">Fahrzeug</p>
          <p class="mt-1 text-sm font-semibold text-white">
            {{ tour.vehicle?.plateNumber ?? '—' }}
          </p>
          <p v-if="tour.vehicle" class="text-xs text-slate-400">
            {{ tour.vehicle.name }} · {{ tour.vehicle.seats }} Sitze
          </p>
        </div>
        <div class="surface-card p-4">
          <p class="text-[10px] uppercase tracking-wide text-slate-500">Lenkzeit</p>
          <p class="mt-1 text-sm font-semibold text-white">
            {{ minutesToRoundedHours(tour.totalDrivingMinutes) }}
          </p>
          <p class="text-xs text-slate-400">{{ COMPLIANCE_PROFILE_LABELS[tour.complianceProfile] }}</p>
        </div>
      </div>

      <div class="surface-card p-4">
        <h2 class="mb-4 text-sm font-semibold text-white">Haltestellen</h2>
        <DriverStopTimeline :stops="tour.stops" />
      </div>

      <ClientOnly>
        <div class="surface-card overflow-hidden p-1">
          <DispatcherTourMap :stops="mapStops" />
        </div>
      </ClientOnly>

      <div v-if="actionLabel && nextStatus" class="sticky bottom-20 z-30">
        <button
          type="button"
          class="btn-primary w-full !min-h-12 text-base"
          :disabled="acting"
          @click="onStatusAction"
        >
          {{ acting ? 'Speichern…' : actionLabel }}
        </button>
      </div>
    </template>
  </div>
</template>
