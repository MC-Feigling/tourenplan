<script setup lang="ts">
import { ISO_WEEKDAYS, STOP_TYPES, STOP_TYPE_LABELS, WEEKDAY_LABELS } from '~/shared/constants/tours'

definePageMeta({
  middleware: 'auth',
  roles: ['admin', 'dispatcher'],
})

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')

type LineStopForm = {
  locationName: string
  address: string
  stopType: (typeof STOP_TYPES)[number]
  offsetMinutesFromStart: number
  dwellMinutes: number
  drivingMinutesFromPrev: number
}

const form = ref({
  name: '',
  lineLengthKm: 30,
  weekdays: [1, 2, 3, 4, 5] as number[],
  defaultDepartureTime: '06:00',
  defaultStops: [
    { locationName: 'Betriebshof', address: '', stopType: 'depot' as const, offsetMinutesFromStart: 0, dwellMinutes: 10, drivingMinutesFromPrev: 0 },
    { locationName: 'Endhaltestelle', address: '', stopType: 'dropoff' as const, offsetMinutesFromStart: 60, dwellMinutes: 5, drivingMinutesFromPrev: 50 },
  ] as LineStopForm[],
  active: true,
})

const saveError = ref<string | null>(null)
const saving = ref(false)

const { data: existingLine, pending, error: loadError } = await useAsyncData(
  () => `dispatcher-line-${id.value}`,
  async () => {
    if (isNew.value) return null
    const apiFetch = useApiFetch()
    const res = await apiFetch<{ item: typeof form.value & { id: string } }>(`/api/line-templates/${id.value}`, {
      credentials: 'include',
    })
    return res.item
  },
  { watch: [id] },
)

watch(
  existingLine,
  (line) => {
    if (line) {
      form.value = {
        name: line.name,
        lineLengthKm: line.lineLengthKm,
        weekdays: line.weekdays,
        defaultDepartureTime: line.defaultDepartureTime,
        defaultStops: line.defaultStops,
        active: line.active,
      }
    }
  },
  { immediate: true },
)

function toggleWeekday(day: number) {
  const set = new Set(form.value.weekdays)
  if (set.has(day)) set.delete(day)
  else set.add(day)
  form.value.weekdays = [...set].sort()
}

function addStop() {
  const last = form.value.defaultStops[form.value.defaultStops.length - 1]
  form.value.defaultStops.push({
    locationName: '',
    address: '',
    stopType: 'pickup',
    offsetMinutesFromStart: (last?.offsetMinutesFromStart ?? 0) + 30,
    dwellMinutes: 5,
    drivingMinutesFromPrev: 20,
  })
}

async function onSave() {
  saveError.value = null
  saving.value = true
  try {
    if (isNew.value) {
      const apiFetch = useApiFetch()
      const res = await apiFetch<{ item: { id: string } }>('/api/line-templates', {
        method: 'POST',
        body: form.value,
        credentials: 'include',
      })
      await router.replace(`/dispatcher/lines/${res.item.id}`)
    } else {
      const apiFetch = useApiFetch()
      await apiFetch(`/api/line-templates/${id.value}`, {
        method: 'PATCH',
        body: form.value,
        credentials: 'include',
      })
    }
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    saveError.value = err.data?.statusMessage ?? 'Speichern fehlgeschlagen'
  } finally {
    saving.value = false
  }
}

useHead({ title: isNew.value ? 'Linie anlegen' : form.value.name })
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader :title="isNew ? 'Linie anlegen' : form.name" description="Wiederkehrende Linienfahrt">
      <template #actions>
        <NuxtLink to="/dispatcher/lines" class="btn-ghost no-underline">← Zurück</NuxtLink>
      </template>
    </AdminPageHeader>

    <div v-if="pending && !existingLine" class="text-sm text-slate-400">Laden…</div>

    <div
      v-else-if="loadError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      Linie konnte nicht geladen werden
    </div>

    <template v-else>
      <div v-if="saveError" class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {{ saveError }}
      </div>

      <form class="surface-card space-y-5 p-5" @submit.prevent="onSave">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label class="block text-xs text-slate-400">Name</label>
          <input v-model="form.name" required class="input-field">
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs text-slate-400">Linienlänge (km)</label>
          <input v-model.number="form.lineLengthKm" type="number" min="0" required class="input-field">
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label class="block text-xs text-slate-400">Standard-Abfahrt</label>
          <input v-model="form.defaultDepartureTime" type="time" required class="input-field">
        </div>
        <label class="flex min-h-touch items-center gap-3 self-end rounded-xl border border-white/10 px-4 py-3">
          <input v-model="form.active" type="checkbox" class="h-4 w-4 rounded">
          <span class="text-sm text-slate-200">Aktiv</span>
        </label>
      </div>

      <fieldset class="space-y-2">
        <legend class="text-xs text-slate-400">Wochentage</legend>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="day in ISO_WEEKDAYS"
            :key="day"
            type="button"
            class="min-h-touch rounded-xl border px-4 py-2 text-sm font-medium"
            :class="form.weekdays.includes(day)
              ? 'border-brand-500/50 bg-brand-500/15 text-brand-300'
              : 'border-white/10 bg-white/5 text-slate-400'"
            @click="toggleWeekday(day)"
          >
            {{ WEEKDAY_LABELS[day] }}
          </button>
        </div>
      </fieldset>

      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-white">Standard-Haltestellen</h3>
        <article
          v-for="(stop, index) in form.defaultStops"
          :key="index"
          class="rounded-xl border border-white/10 p-4"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1.5 sm:col-span-2">
              <label class="block text-xs text-slate-400">Ort</label>
              <input v-model="stop.locationName" required class="input-field">
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs text-slate-400">Offset (min ab Start)</label>
              <input v-model.number="stop.offsetMinutesFromStart" type="number" min="0" class="input-field">
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs text-slate-400">Aufenthalt (min)</label>
              <input v-model.number="stop.dwellMinutes" type="number" min="0" class="input-field">
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs text-slate-400">Lenkzeit ab vorher (min)</label>
              <input v-model.number="stop.drivingMinutesFromPrev" type="number" min="0" class="input-field">
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs text-slate-400">Typ</label>
              <select v-model="stop.stopType" class="input-field">
                <option v-for="t in STOP_TYPES" :key="t" :value="t">{{ STOP_TYPE_LABELS[t] }}</option>
              </select>
            </div>
          </div>
        </article>
        <button type="button" class="btn-ghost w-full" @click="addStop">+ Haltestelle</button>
      </div>

      <button type="submit" class="btn-primary" :disabled="saving || form.weekdays.length === 0">
        {{ saving ? 'Speichern…' : 'Speichern' }}
      </button>
      </form>
    </template>
  </div>
</template>
