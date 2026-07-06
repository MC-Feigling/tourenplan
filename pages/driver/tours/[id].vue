<script setup lang="ts">
import { COMPLIANCE_PROFILE_LABELS } from '~/shared/constants/compliance'
import { TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
import { minutesToRoundedHours } from '~/shared/utils/time'
import type { TourStopFormRow } from '~/composables/useToursApi'

definePageMeta({
  layout: 'driver',
  middleware: 'auth',
  roles: ['driver'],
})

const route = useRoute()
const api = useDriverApi()

const id = computed(() => route.params.id as string)
const actionError = ref<string | null>(null)
const acting = ref(false)

const { data, pending, error } = await useAsyncData(
  () => `driver-tour-${id.value}`,
  () => api.get(id.value),
  { watch: [id] },
)

const tour = computed(() => data.value?.item ?? null)
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
    data.value = res
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
      <UButton to="/driver" variant="link" color="primary" class="px-0">← Meine Touren</UButton>
      <div v-if="tour">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 class="font-display text-xl font-bold text-white">{{ tour.name }}</h1>
            <p class="mt-1 text-sm text-slate-400">
              {{ new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date(`${tour.date}T12:00:00`)) }}
              · {{ TOUR_TYPE_LABELS[tour.type] }}
            </p>
          </div>
          <UBadge color="neutral" variant="subtle">{{ TOUR_STATUS_LABELS[tour.status] }}</UBadge>
        </div>
      </div>
    </header>

    <div v-if="pending && !tour" class="text-sm text-slate-400">Laden…</div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Tour konnte nicht geladen werden"
      role="alert"
    />

    <template v-else-if="tour">
      <UAlert
        v-if="actionError"
        color="error"
        variant="subtle"
        :title="actionError"
        role="alert"
      />

      <div class="grid gap-3 sm:grid-cols-2">
        <UiAppCard body-class="p-4">
          <p class="text-[10px] uppercase tracking-wide text-slate-500">Fahrzeug</p>
          <p class="mt-1 text-sm font-semibold text-white">
            {{ tour.vehicle?.plateNumber ?? '—' }}
          </p>
          <p v-if="tour.vehicle" class="text-xs text-slate-400">
            {{ tour.vehicle.name }} · {{ tour.vehicle.seats }} Sitze
          </p>
        </UiAppCard>
        <UiAppCard body-class="p-4">
          <p class="text-[10px] uppercase tracking-wide text-slate-500">Lenkzeit</p>
          <p class="mt-1 text-sm font-semibold text-white">
            {{ minutesToRoundedHours(tour.totalDrivingMinutes) }}
          </p>
          <p class="text-xs text-slate-400">{{ COMPLIANCE_PROFILE_LABELS[tour.complianceProfile] }}</p>
        </UiAppCard>
      </div>

      <UiAppCard body-class="p-4">
        <h2 class="mb-4 text-sm font-semibold text-white">Haltestellen</h2>
        <DriverStopTimeline :stops="tour.stops" />
      </UiAppCard>

      <ClientOnly>
        <UiAppCard body-class="overflow-hidden p-1">
          <LazyDispatcherTourMap :stops="mapStops" />
        </UiAppCard>
      </ClientOnly>

      <div v-if="actionLabel && nextStatus" class="sticky bottom-20 z-30">
        <UButton
          block
          color="primary"
          size="lg"
          :loading="acting"
          @click="onStatusAction"
        >
          {{ actionLabel }}
        </UButton>
      </div>
    </template>
  </div>
</template>
