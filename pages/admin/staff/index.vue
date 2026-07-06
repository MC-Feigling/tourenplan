<script setup lang="ts">
import { STAFF_JOB_ROLE_LABELS } from '~/shared/constants/staff'

definePageMeta({
  middleware: 'auth',
  roles: ['admin'],
})

const api = useStaffApi()
const staffApiError = api.error

const { data, pending, error } = useAsyncData(
  'admin-staff',
  () => api.list(),
  { lazy: true },
)

const isInitialLoading = computed(() => pending.value && !data.value)
const items = computed(() => data.value?.items ?? [])

useHead({ title: 'Mitarbeiter' })
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader title="Mitarbeiter" description="Fahrer und Disponenten verwalten">
      <template #actions>
        <NuxtLink to="/admin/staff/new" class="btn-primary no-underline">
          + Neu
        </NuxtLink>
      </template>
    </AdminPageHeader>

    <div v-if="isInitialLoading" class="text-sm text-slate-400">Laden…</div>

    <div
      v-else-if="error || staffApiError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {{ staffApiError ?? 'Mitarbeiter konnten nicht geladen werden' }}
    </div>

    <UiEmptyState
      v-else-if="items.length === 0"
      title="Noch keine Mitarbeiter"
      description="Lege den ersten Fahrer oder Disponenten an."
    >
      <template #icon>
        <svg class="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      </template>
      <template #action>
        <NuxtLink to="/admin/staff/new" class="btn-primary no-underline">Mitarbeiter anlegen</NuxtLink>
      </template>
    </UiEmptyState>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="member in items"
        :key="member.id"
        :to="`/admin/staff/${member.id}`"
        class="surface-card block p-4 no-underline transition-colors hover:border-brand-500/30"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="truncate font-semibold text-white">{{ member.fullName }}</p>
            <p class="mt-0.5 text-sm text-slate-400">{{ STAFF_JOB_ROLE_LABELS[member.jobRole] }}</p>
          </div>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
            :class="member.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-600/30 text-slate-400'"
          >
            {{ member.active ? 'Aktiv' : 'Inaktiv' }}
          </span>
        </div>
        <p v-if="member.licenseClasses.length" class="mt-3 text-xs text-slate-500">
          Klasse {{ member.licenseClasses.join(', ') }}
        </p>
      </NuxtLink>
    </div>
  </div>
</template>
