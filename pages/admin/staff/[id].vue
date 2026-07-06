<script setup lang="ts">
import { LEAVE_TYPE_LABELS } from '~/shared/constants/staff'
import type { PublicLeaveRequest } from '~/shared/types/staff'
import { emptyLeaveForm, emptyStaffForm, staffToForm } from '~/composables/useStaffApi'

definePageMeta({
  middleware: 'auth',
  roles: ['admin'],
})

const route = useRoute()
const router = useRouter()
const api = useStaffApi()

const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')

const form = ref(emptyStaffForm())
const leaveRequests = ref<PublicLeaveRequest[]>([])
const leaveForm = ref(emptyLeaveForm())
const showLeaveForm = ref(false)
const saveError = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)

const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-staff-${id.value}`,
  () => (isNew.value ? Promise.resolve(null) : api.get(id.value)),
  { watch: [id] },
)

watch(
  data,
  (res) => {
    if (res) {
      form.value = staffToForm(res.item)
      leaveRequests.value = res.leaveRequests
    }
  },
  { immediate: true },
)

const pageTitle = computed(() =>
  isNew.value ? 'Mitarbeiter anlegen' : `${form.value.firstName} ${form.value.lastName}`.trim() || 'Mitarbeiter',
)

useHead({ title: pageTitle })

async function onSave() {
  saveError.value = null
  saving.value = true
  try {
    if (isNew.value) {
      const res = await api.create(form.value)
      await router.replace(`/admin/staff/${res.item.id}`)
    } else {
      await api.update(id.value, form.value)
      await refresh()
    }
  } catch {
    saveError.value = api.error.value
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (isNew.value) return
  if (!confirm('Mitarbeiter wirklich löschen?')) return
  deleting.value = true
  try {
    await api.remove(id.value)
    await router.push('/admin/staff')
  } catch {
    saveError.value = api.error.value
  } finally {
    deleting.value = false
  }
}

async function onAddLeave() {
  saveError.value = null
  try {
    const res = await api.addLeave(id.value, leaveForm.value)
    leaveRequests.value = [res.item, ...leaveRequests.value]
    leaveForm.value = emptyLeaveForm()
    showLeaveForm.value = false
  } catch {
    saveError.value = api.error.value
  }
}

async function onRemoveLeave(leaveId: string) {
  if (!confirm('Abwesenheit entfernen?')) return
  await api.removeLeave(leaveId)
  leaveRequests.value = leaveRequests.value.filter((l) => l.id !== leaveId)
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader :title="pageTitle" :description="isNew ? 'Neuen Mitarbeiter erfassen' : 'Stammdaten bearbeiten'">
      <template #actions>
        <UButton to="/admin/staff" variant="ghost" color="neutral">← Zurück</UButton>
      </template>
    </AdminPageHeader>

    <div v-if="!isNew && pending && !data" class="text-sm text-slate-400">Laden…</div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Mitarbeiter konnte nicht geladen werden"
      role="alert"
    />

    <template v-else>
      <UAlert
        v-if="saveError"
        color="error"
        variant="subtle"
        :title="saveError"
        role="alert"
      />

      <UiAppCard body-class="p-5 sm:p-6">
        <AdminStaffForm v-model="form" @submit="onSave">
          <template #actions>
            <UButton type="submit" color="primary" :loading="saving">
              Speichern
            </UButton>
            <UButton
              v-if="!isNew"
              type="button"
              variant="ghost"
              color="error"
              :loading="deleting"
              @click="onDelete"
            >
              Löschen
            </UButton>
          </template>
        </AdminStaffForm>
      </UiAppCard>

      <section v-if="!isNew" class="space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold text-white">Abwesenheit</h2>
          <UButton variant="ghost" color="neutral" @click="showLeaveForm = !showLeaveForm">
            {{ showLeaveForm ? 'Abbrechen' : '+ Eintragen' }}
          </UButton>
        </div>

        <UiAppCard v-if="showLeaveForm">
          <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="onAddLeave">
            <UFormField label="Von" name="startDate">
              <UInput v-model="leaveForm.startDate" type="date" required class="w-full" />
            </UFormField>
            <UFormField label="Bis" name="endDate">
              <UInput v-model="leaveForm.endDate" type="date" required class="w-full" />
            </UFormField>
            <UFormField label="Art" name="type" class="sm:col-span-2">
              <USelect
                v-model="leaveForm.type"
                :items="[
                  { label: 'Urlaub', value: 'vacation' },
                  { label: 'Krank', value: 'sick' },
                  { label: 'Sonstiges', value: 'other' },
                ]"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Notiz" name="note" class="sm:col-span-2">
              <UInput v-model="leaveForm.note" placeholder="optional" class="w-full" />
            </UFormField>
            <div class="sm:col-span-2">
              <UButton type="submit" color="primary">Abwesenheit speichern</UButton>
            </div>
          </form>
        </UiAppCard>

        <div v-if="leaveRequests.length === 0" class="text-sm text-slate-500">Keine Abwesenheiten eingetragen.</div>

        <ul v-else class="space-y-2">
          <li v-for="leave in leaveRequests" :key="leave.id">
            <UiAppCard body-class="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p class="text-sm font-medium text-white">
                  {{ LEAVE_TYPE_LABELS[leave.type] }}
                  <span class="font-normal text-slate-400">· {{ leave.startDate }} – {{ leave.endDate }}</span>
                </p>
                <p v-if="leave.note" class="mt-0.5 text-xs text-slate-500">{{ leave.note }}</p>
              </div>
              <UButton
                variant="ghost"
                color="error"
                size="xs"
                @click="onRemoveLeave(leave.id)"
              >
                Entfernen
              </UButton>
            </UiAppCard>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
