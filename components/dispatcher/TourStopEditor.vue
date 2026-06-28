<script setup lang="ts">
import { STOP_TYPES, STOP_TYPE_LABELS } from '~/shared/constants/tours'
import type { GeocodeResult } from '~/shared/types/routing'
import type { TourStopFormRow } from '~/composables/useToursApi'
import { emptyStop } from '~/composables/useToursApi'

const stops = defineModel<TourStopFormRow[]>({ required: true })

defineProps<{
  disabled?: boolean
}>()

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
            <span
              v-if="stop.lat !== null && stop.lng !== null"
              class="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300"
            >
              GPS
            </span>
            <div v-if="!disabled" class="flex gap-1">
              <button type="button" class="btn-ghost !min-h-8 !px-2 !py-1 text-xs" :disabled="index === 0" @click="moveStop(index, -1)">↑</button>
              <button type="button" class="btn-ghost !min-h-8 !px-2 !py-1 text-xs" :disabled="index === stops.length - 1" @click="moveStop(index, 1)">↓</button>
              <button type="button" class="btn-ghost !min-h-8 !px-2 !py-1 text-xs !text-red-300" :disabled="stops.length <= 1" @click="removeStop(index)">×</button>
            </div>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1.5 sm:col-span-2">
            <label class="block text-xs text-slate-400">Ort</label>
            <input v-model="stop.locationName" required :disabled="disabled" class="input-field">
          </div>
          <div class="space-y-1.5 sm:col-span-2">
            <label class="block text-xs text-slate-400">Adresse</label>
            <DispatcherAddressSearch
              v-if="!disabled"
              v-model="stop.address"
              @select="onAddressSelect(index, $event)"
            />
            <input v-else v-model="stop.address" disabled class="input-field">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs text-slate-400">Ankunft</label>
            <input v-model="stop.plannedArrival" type="time" required :disabled="disabled" class="input-field">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs text-slate-400">Abfahrt</label>
            <input v-model="stop.plannedDeparture" type="time" required :disabled="disabled" class="input-field">
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs text-slate-400">Typ</label>
            <select v-model="stop.stopType" :disabled="disabled" class="input-field">
              <option v-for="t in STOP_TYPES" :key="t" :value="t">{{ STOP_TYPE_LABELS[t] }}</option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="block text-xs text-slate-400">Lenkzeit ab vorher (min)</label>
            <input v-model.number="stop.drivingMinutesFromPrev" type="number" min="0" :disabled="disabled || index === 0" class="input-field">
          </div>
        </div>
      </article>
    </div>

    <button v-if="!disabled" type="button" class="btn-ghost w-full" @click="addStop">
      + Haltestelle
    </button>
  </div>
</template>
