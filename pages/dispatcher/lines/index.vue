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
        <UButton to="/dispatcher" variant="ghost" color="neutral">← Wochenplan</UButton>
        <UButton v-if="canEdit" to="/dispatcher/lines/new" color="primary">+ Linie</UButton>
      </template>
    </AdminPageHeader>

    <div v-if="isInitialLoading" class="text-sm text-slate-400">Laden…</div>

    <UAlert
      v-else-if="error || toursApiError"
      color="error"
      variant="subtle"
      :title="toursApiError ?? 'Linien konnten nicht geladen werden'"
    />

    <UiEmptyState
      v-else-if="items.length === 0"
      title="Keine Linien"
      description="Lege eine wiederkehrende Linie an und generiere Touren im Wochenplan."
    >
      <template #action>
        <UButton v-if="canEdit" to="/dispatcher/lines/new" color="primary">Linie anlegen</UButton>
      </template>
    </UiEmptyState>

    <div v-else class="grid gap-3 sm:grid-cols-2">
      <NuxtLink
        v-for="line in items"
        :key="line.id"
        :to="`/dispatcher/lines/${line.id}`"
        class="block no-underline"
      >
        <UiAppCard body-class="p-4 hover:border-brand-500/30">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-white">{{ line.name }}</p>
              <p class="mt-1 text-sm text-slate-400">{{ line.lineLengthKm }} km · Ab {{ line.defaultDepartureTime }}</p>
            </div>
            <UBadge :color="line.active ? 'success' : 'neutral'" variant="subtle" size="sm">
              {{ line.active ? 'Aktiv' : 'Inaktiv' }}
            </UBadge>
          </div>
          <p class="mt-3 text-xs text-slate-500">
            {{ line.weekdays.map((d) => WEEKDAY_LABELS[d as keyof typeof WEEKDAY_LABELS]).join(', ') }}
            · {{ line.defaultStops.length }} Haltestellen
          </p>
        </UiAppCard>
      </NuxtLink>
    </div>
  </div>
</template>
