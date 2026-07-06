<script setup lang="ts">
import { WEEKDAY_LABELS } from '~/shared/constants/tours'

definePageMeta({
  middleware: 'auth',
  roles: ['admin', 'dispatcher', 'viewer'],
})

const api = useToursApi()
const toursApiError = api.error
const auth = useAuthStore()
const canEdit = computed(() => auth.hasRole('admin', 'dispatcher'))

const { data, pending, error } = useAsyncData(
  'dispatcher-lines',
  () => api.listLineTemplates(),
  { lazy: true },
)

const isInitialLoading = computed(() => pending.value && !data.value)
const items = computed(() => data.value?.items ?? [])

useHead({ title: 'Linien' })
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader title="Linien" description="Wiederkehrende Linienfahrten">
      <template #actions>
        <NuxtLink to="/dispatcher" class="btn-ghost no-underline">← Wochenplan</NuxtLink>
        <NuxtLink v-if="canEdit" to="/dispatcher/lines/new" class="btn-primary no-underline">+ Linie</NuxtLink>
      </template>
    </AdminPageHeader>

    <div v-if="isInitialLoading" class="text-sm text-slate-400">Laden…</div>

    <div
      v-else-if="error || toursApiError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {{ toursApiError ?? 'Linien konnten nicht geladen werden' }}
    </div>

    <UiEmptyState
      v-else-if="items.length === 0"
      title="Keine Linien"
      description="Lege eine wiederkehrende Linie an und generiere Touren im Wochenplan."
    >
      <template #action>
        <NuxtLink v-if="canEdit" to="/dispatcher/lines/new" class="btn-primary no-underline">Linie anlegen</NuxtLink>
      </template>
    </UiEmptyState>

    <div v-else class="grid gap-3 sm:grid-cols-2">
      <NuxtLink
        v-for="line in items"
        :key="line.id"
        :to="`/dispatcher/lines/${line.id}`"
        class="surface-card block p-4 no-underline hover:border-brand-500/30"
      >
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-white">{{ line.name }}</p>
            <p class="mt-1 text-sm text-slate-400">{{ line.lineLengthKm }} km · Ab {{ line.defaultDepartureTime }}</p>
          </div>
          <span
            class="rounded-full px-2 py-0.5 text-[10px]"
            :class="line.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-400'"
          >
            {{ line.active ? 'Aktiv' : 'Inaktiv' }}
          </span>
        </div>
        <p class="mt-3 text-xs text-slate-500">
          {{ line.weekdays.map((d) => WEEKDAY_LABELS[d as keyof typeof WEEKDAY_LABELS]).join(', ') }}
          · {{ line.defaultStops.length }} Haltestellen
        </p>
      </NuxtLink>
    </div>
  </div>
</template>
