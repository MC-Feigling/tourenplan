<script setup lang="ts">
import { COMPLIANCE_PROFILE_LABELS } from '~/shared/constants/compliance'
import { TOUR_TYPES, TOUR_STATUSES, TOUR_TYPE_LABELS, TOUR_STATUS_LABELS } from '~/shared/constants/tours'
import { minutesToRoundedHours } from '~/shared/utils/time'
import {
  emptyTourForm,
  tourToForm,
  type TourFormState,
} from '~/composables/useToursApi'
import { applyRouteToStops, stopsWithCoordinates, useRoutingApi } from '~/composables/useRoutingApi'
import { useAssignmentApi } from '~/composables/useAssignmentApi'
import type { AssignmentCheckResult } from '~/composables/useAssignmentApi'

definePageMeta({
  middleware: 'auth',
  roles: ['admin', 'dispatcher', 'viewer'],
})

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const api = useToursApi()
const routing = useRoutingApi()
const assignmentApi = useAssignmentApi()
const routingLoading = routing.loading
const assignmentLoading = assignmentApi.loading

const assignmentResult = ref<AssignmentCheckResult | null>(null)
let assignmentTimeout: ReturnType<typeof setTimeout> | null = null

const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')
const canEdit = computed(() => auth.hasRole('admin', 'dispatcher'))

const defaultDate = typeof route.query.date === 'string' ? route.query.date : new Date().toISOString().slice(0, 10)
const defaultType = route.query.type === 'line' ? 'line' : 'excursion'

const form = ref<TourFormState>(emptyTourForm(defaultDate, defaultType))
const saveError = ref<string | null>(null)
const routeError = ref<string | null>(null)
const saving = ref(false)
const complianceProfile = ref<string | null>(null)
const routeCoordinates = ref<[number, number][]>([])
const routeStats = ref<{ totalDrivingMinutes: number; totalDistanceKm: number } | null>(null)

const { data: existingTour } = await useAsyncData(
  () => `dispatcher-tour-${id.value}`,
  async () => {
    if (isNew.value) return null
    return (await api.get(id.value)).item
  },
  { watch: [id] },
)

watch(
  existingTour,
  (tour) => {
    if (tour) {
      form.value = tourToForm(tour)
      complianceProfile.value = tour.complianceProfile
    }
  },
  { immediate: true },
)

const { data: assignmentResources } = await useAsyncData(
  () => `tour-assignment-resources-${form.value.date}`,
  async () => {
    try {
      return await assignmentApi.loadResources(form.value.date, form.value.date)
    } catch {
      return { drivers: [], vehicles: [] }
    }
  },
  { watch: [() => form.value.date] },
)

const drivers = computed(() => assignmentResources.value?.drivers ?? [])
const vehicles = computed(() => assignmentResources.value?.vehicles ?? [])

const pageTitle = computed(() => (isNew.value ? 'Tour anlegen' : form.value.name || 'Tour'))
const geocodedCount = computed(() => stopsWithCoordinates(form.value.stops).length)

useHead({ title: pageTitle })

async function runAssignmentCheck() {
  if (form.value.stops.length === 0) return
  try {
    assignmentResult.value = await assignmentApi.validateTour(form.value, {
      tourId: isNew.value ? undefined : id.value,
    })
  } catch {
    assignmentResult.value = null
  }
}

function scheduleAssignmentCheck() {
  if (assignmentTimeout) clearTimeout(assignmentTimeout)
  assignmentTimeout = setTimeout(() => void runAssignmentCheck(), 400)
}

watch(form, () => scheduleAssignmentCheck(), { deep: true })

onMounted(() => {
  void runAssignmentCheck()
})

async function onSave() {
  if (!canEdit.value) return
  saveError.value = null
  saving.value = true
  try {
    if (isNew.value) {
      const res = await api.create(form.value)
      complianceProfile.value = res.item.complianceProfile
      await router.replace(`/dispatcher/tours/${res.item.id}`)
    } else {
      await api.update(id.value, form.value)
      const res = await api.saveStops(id.value, form.value.stops)
      form.value = tourToForm(res.item)
      complianceProfile.value = res.item.complianceProfile
    }
  } catch {
    saveError.value = api.error.value
  } finally {
    saving.value = false
  }
}

async function onCalculateRoute() {
  routeError.value = null
  const coords = stopsWithCoordinates(form.value.stops)
  if (coords.length < 2) {
    routeError.value = 'Mindestens 2 Stopps mit Adresse/GPS nötig'
    return
  }
  try {
    const res = await routing.directions(
      coords.map((stop) => ({ lat: stop.lat!, lng: stop.lng! })),
    )
    form.value.stops = applyRouteToStops(form.value.stops, res.result.segments)
    routeCoordinates.value = res.result.geometry.coordinates
    routeStats.value = {
      totalDrivingMinutes: res.result.totalDrivingMinutes,
      totalDistanceKm: res.result.totalDistanceKm,
    }
  } catch {
    routeError.value = routing.error.value
  }
}

async function onDelete() {
  if (!canEdit.value || isNew.value) return
  if (!confirm('Tour wirklich löschen?')) return
  await api.remove(id.value)
  await router.push('/dispatcher')
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader :title="pageTitle" :description="isNew ? 'Neue Tour planen' : 'Tour bearbeiten'">
      <template #actions>
        <NuxtLink to="/dispatcher" class="btn-ghost no-underline">← Wochenplan</NuxtLink>
      </template>
    </AdminPageHeader>

    <div
      v-if="saveError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {{ saveError }}
    </div>

    <div class="surface-card space-y-4 p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-sm font-semibold text-white">Route</h2>
          <p class="mt-1 text-xs text-slate-400">
            Adressen suchen, Route berechnen — Zeiten werden automatisch gesetzt (manuell überschreibbar).
          </p>
        </div>
        <button
          v-if="canEdit"
          type="button"
          class="btn-primary shrink-0"
          :disabled="routingLoading || geocodedCount < 2"
          @click="onCalculateRoute"
        >
          {{ routingLoading ? 'Berechne…' : 'Route berechnen' }}
        </button>
      </div>

      <div
        v-if="routeError"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      >
        {{ routeError }}
      </div>

      <div v-if="routeStats" class="flex flex-wrap gap-2 text-xs">
        <span class="rounded-md bg-brand-500/15 px-2 py-1 text-brand-300">
          {{ routeStats.totalDistanceKm }} km
        </span>
        <span class="rounded-md bg-brand-500/15 px-2 py-1 text-brand-300">
          {{ minutesToRoundedHours(routeStats.totalDrivingMinutes) }} Lenkzeit
        </span>
      </div>

      <ClientOnly>
        <DispatcherTourMap :stops="form.stops" :route-coordinates="routeCoordinates" />
      </ClientOnly>
    </div>

    <div class="surface-card p-5">
      <DispatcherAssignmentPanel
        v-model:driver-id="form.driverId"
        v-model:vehicle-id="form.vehicleId"
        :result="assignmentResult"
        :loading="assignmentLoading"
        :drivers="drivers"
        :vehicles="vehicles"
        :can-edit="canEdit"
      />
    </div>

    <div class="surface-card p-5">
      <DispatcherCompliancePanel
        :result="assignmentResult?.compliance ?? null"
        :loading="assignmentLoading"
      />
    </div>

    <div class="grid gap-6 lg:grid-cols-5">
      <div class="surface-card space-y-4 p-5 lg:col-span-2">
        <h2 class="text-sm font-semibold text-white">Stammdaten</h2>

        <div class="space-y-1.5">
          <label class="block text-xs text-slate-400">Typ</label>
          <select v-model="form.type" :disabled="!canEdit || !isNew" class="input-field">
            <option v-for="t in TOUR_TYPES" :key="t" :value="t">{{ TOUR_TYPE_LABELS[t] }}</option>
          </select>
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs text-slate-400">Name</label>
          <input v-model="form.name" required :disabled="!canEdit" class="input-field">
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1.5">
            <label class="block text-xs text-slate-400">Datum</label>
            <input v-model="form.date" type="date" required :disabled="!canEdit" class="input-field">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs text-slate-400">Status</label>
            <select v-model="form.status" :disabled="!canEdit" class="input-field">
              <option v-for="s in TOUR_STATUSES" :key="s" :value="s">{{ TOUR_STATUS_LABELS[s] }}</option>
            </select>
          </div>
        </div>

        <div v-if="form.type === 'line'" class="space-y-1.5">
          <label class="block text-xs text-slate-400">Linienlänge (km)</label>
          <input v-model="form.lineLengthKm" type="number" min="0" step="0.1" :disabled="!canEdit" class="input-field">
        </div>

        <div v-if="complianceProfile" class="rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
          Compliance: {{ COMPLIANCE_PROFILE_LABELS[complianceProfile as keyof typeof COMPLIANCE_PROFILE_LABELS] }}
        </div>

        <div class="space-y-1.5">
          <label class="block text-xs text-slate-400">Notizen</label>
          <textarea v-model="form.notes" rows="3" :disabled="!canEdit" class="input-field resize-none" />
        </div>

        <div v-if="canEdit" class="flex flex-wrap gap-2 pt-2">
          <button type="button" class="btn-primary" :disabled="saving" @click="onSave">
            {{ saving ? 'Speichern…' : 'Speichern' }}
          </button>
          <button v-if="!isNew" type="button" class="btn-ghost !text-red-300" @click="onDelete">
            Löschen
          </button>
        </div>
      </div>

      <div class="surface-card p-5 lg:col-span-3">
        <DispatcherTourStopEditor v-model="form.stops" :disabled="!canEdit" />
      </div>
    </div>
  </div>
</template>
