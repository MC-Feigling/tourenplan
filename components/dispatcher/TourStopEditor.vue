<script setup lang="ts">
import { STOP_TYPES, STOP_TYPE_LABELS } from '~/shared/constants/tours'
import type { GeocodeResult } from '~/shared/types/routing'
import type { TourStopFormRow } from '~/composables/useToursApi'
import { emptyStop } from '~/composables/useToursApi'

const stops = defineModel<TourStopFormRow[]>({ required: true })

defineProps<{
  disabled?: boolean
}>()

const stopTypeItems = STOP_TYPES.map((t) => ({ label: STOP_TYPE_LABELS[t], value: t }))

const totalDriving = computed(() =>
  stops.value.reduce((sum, s) => sum + s.drivingMinutesFromPrev, 0),
)

function addStop() {
  const last = stops.value[stops.value.length - 1]
  stops.value.push(
    emptyStop({
      plannedArrival: last?.plannedDeparture ?? '12:00',
      plannedDeparture: last?.plannedDeparture ?? '12:05',
      drivingMinutesFromPrev: 30,
    }),
  )
}

function removeStop(index: number) {
  if (stops.value.length <= 1) return
  stops.value.splice(index, 1)
}

function moveStop(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= stops.value.length) return
  const copy = [...stops.value]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item!)
  stops.value = copy
}

function onAddressSelect(index: number, result: GeocodeResult) {
  const stop = stops.value[index]
  if (!stop) return
  stop.address = result.address
  stop.lat = result.lat
  stop.lng = result.lng
  if (!stop.locationName.trim()) {
    stop.locationName = result.name
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-semibold text-white">Haltestellen</h3>
      <span class="text-xs text-slate-400">Σ {{ totalDriving }} min Lenkzeit</span>
    </div>

    <div class="space-y-3">
      <article
        v-for="(stop, index) in stops"
        :key="index"
        class="rounded-xl border border-white/10 bg-white/[0.03] p-4"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-xs font-bold text-brand-300">
            {{ index + 1 }}
          </span>
          <div class="flex items-center gap-2">
            <UBadge v-if="stop.lat !== null && stop.lng !== null" color="success" variant="subtle" size="sm">
              GPS
            </UBadge>
            <div v-if="!disabled" class="flex gap-1">
              <UButton size="xs" variant="ghost" color="neutral" :disabled="index === 0" @click="moveStop(index, -1)">↑</UButton>
              <UButton size="xs" variant="ghost" color="neutral" :disabled="index === stops.length - 1" @click="moveStop(index, 1)">↓</UButton>
              <UButton size="xs" variant="ghost" color="error" :disabled="stops.length <= 1" @click="removeStop(index)">×</UButton>
            </div>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Ort" :name="`stop-location-${index}`" class="sm:col-span-2">
            <UInput v-model="stop.locationName" required :disabled="disabled" class="w-full" />
          </UFormField>
          <UFormField label="Adresse" :name="`stop-address-${index}`" class="sm:col-span-2">
            <DispatcherAddressSearch
              v-if="!disabled"
              v-model="stop.address"
              @select="onAddressSelect(index, $event)"
            />
            <UInput v-else v-model="stop.address" disabled class="w-full" />
          </UFormField>
          <UFormField label="Ankunft" :name="`stop-arrival-${index}`">
            <UInput v-model="stop.plannedArrival" type="time" required :disabled="disabled" class="w-full" />
          </UFormField>
          <UFormField label="Abfahrt" :name="`stop-departure-${index}`">
            <UInput v-model="stop.plannedDeparture" type="time" required :disabled="disabled" class="w-full" />
          </UFormField>
          <UFormField label="Typ" :name="`stop-type-${index}`">
            <USelect v-model="stop.stopType" :items="stopTypeItems" :disabled="disabled" class="w-full" />
          </UFormField>
          <UFormField label="Lenkzeit ab vorher (min)" :name="`stop-driving-${index}`">
            <UInput
              v-model="stop.drivingMinutesFromPrev"
              type="number"
              min="0"
              :disabled="disabled || index === 0"
              class="w-full"
            />
          </UFormField>
        </div>
      </article>
    </div>

    <UButton v-if="!disabled" type="button" variant="outline" color="neutral" block @click="addStop">
      + Haltestelle
    </UButton>
  </div>
</template>
