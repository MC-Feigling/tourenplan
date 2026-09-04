<script setup lang="ts">
import { STOP_TYPE_LABELS } from '~/shared/constants/tours'
import type { PublicTourStop } from '~/shared/types/tours'
import { buildMapsNavUrl } from '~/shared/utils/mapsNav'

const props = defineProps<{
  stops: PublicTourStop[]
}>()

const navUrlsByStopId = computed(() => {
  const map = new Map<string, string>()
  for (const stop of props.stops) {
    const url = buildMapsNavUrl({
      lat: stop.lat,
      lng: stop.lng,
      address: stop.address,
    })
    if (url) map.set(stop.id, url)
  }
  return map
})
</script>

<template>
  <ol class="space-y-0">
    <li
      v-for="(stop, index) in stops"
      :key="stop.id"
      class="relative flex gap-3 pb-6 last:pb-0"
    >
      <div class="flex flex-col items-center">
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          :class="index === 0 || index === stops.length - 1
            ? 'bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30'
            : 'bg-white/10 text-slate-300 ring-1 ring-white/10'"
        >
          {{ index + 1 }}
        </span>
        <span
          v-if="index < stops.length - 1"
          class="mt-1 w-px flex-1 bg-white/10"
          aria-hidden="true"
        />
      </div>

      <div class="min-w-0 flex-1 pt-0.5">
        <p class="font-medium text-white">{{ stop.locationName }}</p>
        <p v-if="stop.address" class="mt-0.5 text-xs text-slate-500">{{ stop.address }}</p>
        <div class="mt-2 flex flex-wrap gap-2 text-[10px]">
          <span class="rounded-md bg-white/5 px-2 py-0.5 text-slate-400">
            {{ stop.plannedArrival }} – {{ stop.plannedDeparture }}
          </span>
          <span class="rounded-md bg-white/5 px-2 py-0.5 text-slate-500">
            {{ STOP_TYPE_LABELS[stop.stopType] }}
          </span>
        </div>
        <a
          v-if="navUrlsByStopId.get(stop.id)"
          :href="navUrlsByStopId.get(stop.id)"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-2 inline-flex text-xs font-medium text-brand-300 underline-offset-2 hover:underline"
        >
          Navigieren
        </a>
      </div>
    </li>
  </ol>
</template>
