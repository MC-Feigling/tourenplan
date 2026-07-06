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
  <UiAppCard body-class="space-y-4 p-5">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-sm font-semibold text-white">Route</h2>
        <p class="mt-1 text-xs text-slate-400">
          Adressen suchen, Route berechnen — Zeiten werden automatisch gesetzt (manuell überschreibbar).
        </p>
      </div>
      <UButton
        v-if="canEdit"
        color="primary"
        class="shrink-0"
        :disabled="routingLoading || geocodedCount < 2"
        :loading="routingLoading"
        @click="emit('calculateRoute')"
      >
        Route berechnen
      </UButton>
    </div>

    <UAlert v-if="routeError" color="error" variant="subtle" :title="routeError" />

    <div v-if="routeStats" class="flex flex-wrap gap-2 text-xs">
      <UBadge color="primary" variant="subtle">{{ routeStats.totalDistanceKm }} km</UBadge>
      <UBadge color="primary" variant="subtle">{{ minutesToRoundedHours(routeStats.totalDrivingMinutes) }} Lenkzeit</UBadge>
    </div>

    <ClientOnly>
      <LazyDispatcherTourMap :stops="stops" :route-coordinates="routeCoordinates" />
    </ClientOnly>
  </UiAppCard>
</template>
