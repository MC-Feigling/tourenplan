<script setup lang="ts">
import {
  emptyTourForm,
  tourToForm,
  type TourFormState,
} from '~/composables/useToursApi'
import { applyRouteToStops, stopsWithCoordinates, useRoutingApi } from '~/composables/useRoutingApi'
import { useAssignmentApi } from '~/composables/useAssignmentApi'

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

const { assignmentResult } = useTourAssignmentCheck({
  form,
  tourId: computed(() => (isNew.value ? undefined : id.value)),
  validate: (formValue, opts) => assignmentApi.validateTour(formValue, opts),
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
        <UButton to="/dispatcher" variant="ghost" color="neutral">← Wochenplan</UButton>
      </template>
    </AdminPageHeader>

    <UAlert
      v-if="saveError"
      color="error"
      variant="subtle"
      :title="saveError"
      role="alert"
    />

    <DispatcherTourRoutePanel
      :stops="form.stops"
      :route-coordinates="routeCoordinates"
      :route-stats="routeStats"
      :route-error="routeError"
      :routing-loading="routingLoading"
      :geocoded-count="geocodedCount"
      :can-edit="canEdit"
      @calculate-route="onCalculateRoute"
    />

    <DispatcherTourAssignmentSection
      v-model:driver-id="form.driverId"
      v-model:vehicle-id="form.vehicleId"
      :result="assignmentResult"
      :loading="assignmentLoading"
      :drivers="drivers"
      :vehicles="vehicles"
      :can-edit="canEdit"
    />

    <DispatcherTourEditorForm
      v-model="form"
      :can-edit="canEdit"
      :is-new="isNew"
      :compliance-profile="complianceProfile"
      :saving="saving"
      @save="onSave"
      @delete="onDelete"
    />
  </div>
</template>
