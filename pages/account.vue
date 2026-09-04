<script setup lang="ts">
import {
  AUTH_MESSAGES,
  CHANGE_PASSWORD_MIN_LENGTH,
} from '~/shared/constants/auth'
import { extractError } from '~/shared/utils/apiError'

definePageMeta({
  middleware: 'auth',
})

const auth = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pending = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

async function onSubmit() {
  errorMessage.value = null
  successMessage.value = null

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwörter stimmen nicht überein'
    return
  }
  if (newPassword.value.length < CHANGE_PASSWORD_MIN_LENGTH) {
    errorMessage.value = AUTH_MESSAGES.passwordTooShort
    return
  }

  pending.value = true
  try {
    await auth.changePassword(currentPassword.value, newPassword.value)
    successMessage.value = AUTH_MESSAGES.changePasswordSuccess
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e: unknown) {
    errorMessage.value = extractError(e, AUTH_MESSAGES.changePasswordFailed)
  } finally {
    pending.value = false
  }
}

useHead({ title: 'Konto' })
</script>

<template>
  <div class="mx-auto max-w-md space-y-6">
    <AdminPageHeader
      title="Konto"
      :description="auth.user?.email ?? 'Passwort ändern'"
    />

    <UiAppCard body-class="space-y-4 p-5">
      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        :title="errorMessage"
        role="alert"
      />
      <UAlert
        v-if="successMessage"
        color="success"
        variant="subtle"
        :title="successMessage"
        role="status"
      />

      <form class="space-y-4" @submit.prevent="onSubmit">
        <UFormField label="Aktuelles Passwort" name="currentPassword">
          <UInput
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            class="w-full"
            required
          />
        </UFormField>
        <UFormField
          label="Neues Passwort"
          name="newPassword"
          :hint="`Mindestens ${CHANGE_PASSWORD_MIN_LENGTH} Zeichen`"
        >
          <UInput
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            class="w-full"
            required
          />
        </UFormField>
        <UFormField label="Neues Passwort bestätigen" name="confirmPassword">
          <UInput
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full"
            required
          />
        </UFormField>
        <UButton type="submit" color="primary" block :loading="pending">
          Passwort ändern
        </UButton>
      </form>
    </UiAppCard>
  </div>
</template>
