<script setup lang="ts">
import { minutesToRoundedHours } from '~/shared/utils/time'
import type { TourStopFormRow } from '~/composables/useToursApi'

defineProps<{
  stops: TourStopFormRow[]
  routeCoordinates: [number, number][]
  routeStats: { totalDrivingMinutes: number; totalDistanceKm: number } | null
  routeError: string | null
  routingLoading: boolean
  geocodedCount: number
  canEdit: boolean
}>()

const emit = defineEmits<{
  calculateRoute: []
}>()
</script>

<template>
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
        @click="emit('calculateRoute')"
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
      <DispatcherTourMap :stops="stops" :route-coordinates="routeCoordinates" />
    </ClientOnly>
  </div>
</template>
