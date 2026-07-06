<script setup lang="ts">
import { emptyVehicleForm, vehicleToForm } from '~/composables/useVehiclesApi'

definePageMeta({
  middleware: 'auth',
  roles: ['admin'],
})

const route = useRoute()
const router = useRouter()
const api = useVehiclesApi()

const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')

const form = ref(emptyVehicleForm())
const saveError = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)

const { data, pending, error, refresh } = await useAsyncData(
  () => `admin-vehicle-${id.value}`,
  () => (isNew.value ? Promise.resolve(null) : api.get(id.value)),
  { watch: [id] },
)

watch(
  data,
  (res) => {
    if (res) {
      form.value = vehicleToForm(res.item)
    }
  },
  { immediate: true },
)

const pageTitle = computed(() =>
  isNew.value ? 'Fahrzeug anlegen' : form.value.name || 'Fahrzeug',
)

useHead({ title: pageTitle })

async function onSave() {
  saveError.value = null
  saving.value = true
  try {
    if (isNew.value) {
      const res = await api.create(form.value)
      await router.replace(`/admin/vehicles/${res.item.id}`)
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
  if (!confirm('Fahrzeug wirklich löschen?')) return
  deleting.value = true
  try {
    await api.remove(id.value)
    await router.push('/admin/vehicles')
  } catch {
    saveError.value = api.error.value
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <AdminPageHeader :title="pageTitle" :description="isNew ? 'Neues Fahrzeug erfassen' : 'Fahrzeugdaten bearbeiten'">
      <template #actions>
        <UButton to="/admin/vehicles" variant="ghost" color="neutral">← Zurück</UButton>
      </template>
    </AdminPageHeader>

    <div v-if="!isNew && pending && !data" class="text-sm text-slate-400">Laden…</div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Fahrzeug konnte nicht geladen werden"
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
        <AdminVehicleForm v-model="form" @submit="onSave">
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
        </AdminVehicleForm>
      </UiAppCard>
    </template>
  </div>
</template>
