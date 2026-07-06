<script setup lang="ts">
defineProps<{
  weekLabel: string
  weekStart: string
  selectedDate: string
  canEdit: boolean
  templatesCount: number
  generating: boolean
  generateMessage: string | null
}>()

const emit = defineEmits<{
  prevWeek: []
  nextWeek: []
  today: []
  generateLines: []
}>()
</script>

<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center gap-2">
      <UButton variant="ghost" color="neutral" size="sm" aria-label="Vorherige Woche" @click="emit('prevWeek')">←</UButton>
      <div class="min-w-[10rem] text-center">
        <p class="font-display text-lg font-bold text-white">{{ weekLabel }}</p>
      </div>
      <UButton variant="ghost" color="neutral" size="sm" aria-label="Nächste Woche" @click="emit('nextWeek')">→</UButton>
      <UButton variant="ghost" color="neutral" size="sm" @click="emit('today')">Heute</UButton>
    </div>

    <div v-if="canEdit" class="flex flex-wrap gap-2">
      <UButton
        v-if="templatesCount"
        variant="ghost"
        color="neutral"
        :loading="generating"
        @click="emit('generateLines')"
      >
        Linien generieren
      </UButton>
      <UButton :to="`/dispatcher/tours/new?date=${selectedDate || weekStart}`" color="primary">
        + Ausflug
      </UButton>
      <UButton to="/dispatcher/lines" variant="ghost" color="neutral">Linien</UButton>
    </div>
  </div>

  <p v-if="generateMessage" class="text-sm text-brand-300" role="status">{{ generateMessage }}</p>
</template>
