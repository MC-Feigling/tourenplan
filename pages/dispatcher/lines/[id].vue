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
        <UButton to="/dispatcher/lines" variant="ghost" color="neutral">← Zurück</UButton>
      </template>
    </AdminPageHeader>

    <div v-if="pending && !existingLine" class="text-sm text-slate-400">Laden…</div>

    <UAlert
      v-else-if="loadError"
      color="error"
      variant="subtle"
      title="Linie konnte nicht geladen werden"
    />

    <template v-else>
      <UAlert v-if="saveError" color="error" variant="subtle" :title="saveError" />

      <UiAppCard body-class="space-y-5 p-5">
      <form class="space-y-5" @submit.prevent="onSave">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Name" name="name">
          <UInput v-model="form.name" required class="w-full" />
        </UFormField>
        <UFormField label="Linienlänge (km)" name="lineLengthKm">
          <UInput v-model="form.lineLengthKm" type="number" min="0" required class="w-full" />
        </UFormField>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Standard-Abfahrt" name="defaultDepartureTime">
          <UInput v-model="form.defaultDepartureTime" type="time" required class="w-full" />
        </UFormField>
        <UCheckbox v-model="form.active" label="Aktiv" class="self-end" />
      </div>

      <fieldset class="space-y-2">
        <legend class="text-xs text-slate-400">Wochentage</legend>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="day in ISO_WEEKDAYS"
            :key="day"
            type="button"
            size="sm"
            :variant="form.weekdays.includes(day) ? 'soft' : 'outline'"
            :color="form.weekdays.includes(day) ? 'primary' : 'neutral'"
            @click="toggleWeekday(day)"
          >
            {{ WEEKDAY_LABELS[day] }}
          </UButton>
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
            <UFormField label="Ort" :name="`stop-${index}-location`" class="sm:col-span-2">
              <UInput v-model="stop.locationName" required class="w-full" />
            </UFormField>
            <UFormField label="Offset (min ab Start)" :name="`stop-${index}-offset`">
              <UInput v-model="stop.offsetMinutesFromStart" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Aufenthalt (min)" :name="`stop-${index}-dwell`">
              <UInput v-model="stop.dwellMinutes" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Lenkzeit ab vorher (min)" :name="`stop-${index}-driving`">
              <UInput v-model="stop.drivingMinutesFromPrev" type="number" min="0" class="w-full" />
            </UFormField>
            <UFormField label="Typ" :name="`stop-${index}-type`">
              <USelect
                v-model="stop.stopType"
                :items="STOP_TYPES.map((t) => ({ label: STOP_TYPE_LABELS[t], value: t }))"
                class="w-full"
              />
            </UFormField>
          </div>
        </article>
        <UButton type="button" variant="outline" color="neutral" block @click="addStop">+ Haltestelle</UButton>
      </div>

      <UButton type="submit" color="primary" :disabled="form.weekdays.length === 0" :loading="saving">
        Speichern
      </UButton>
      </form>
      </UiAppCard>
    </template>
  </div>
</template>
