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
        <UButton to="/admin/staff/new" color="primary">+ Neu</UButton>
      </template>
    </AdminPageHeader>

    <div v-if="isInitialLoading" class="text-sm text-slate-400">Laden…</div>

    <UAlert
      v-else-if="error || staffApiError"
      color="error"
      variant="subtle"
      :title="staffApiError ?? 'Mitarbeiter konnten nicht geladen werden'"
      role="alert"
    />

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
        <UButton to="/admin/staff/new" color="primary">Mitarbeiter anlegen</UButton>
      </template>
    </UiEmptyState>

    <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="member in items"
        :key="member.id"
        :to="`/admin/staff/${member.id}`"
        class="block no-underline"
      >
        <UiAppCard body-class="p-4 transition-colors hover:border-brand-500/30">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="truncate font-semibold text-white">{{ member.fullName }}</p>
              <p class="mt-0.5 text-sm text-slate-400">{{ STAFF_JOB_ROLE_LABELS[member.jobRole] }}</p>
            </div>
            <UBadge
              :color="member.active ? 'success' : 'neutral'"
              variant="subtle"
              size="sm"
            >
              {{ member.active ? 'Aktiv' : 'Inaktiv' }}
            </UBadge>
          </div>
          <p v-if="member.licenseClasses.length" class="mt-3 text-xs text-slate-500">
            Klasse {{ member.licenseClasses.join(', ') }}
          </p>
        </UiAppCard>
      </NuxtLink>
    </div>
  </div>
</template>
