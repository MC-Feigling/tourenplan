<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()

const slots = defineSlots<{
  action?: () => unknown
}>()
</script>

<template>
  <div class="surface-card flex flex-col items-center justify-center px-6 py-12 text-center">
    <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
      <slot name="icon" />
    </div>
    <h2 class="text-lg font-semibold text-white">{{ title }}</h2>
    <p v-if="description" class="mt-2 max-w-sm text-sm text-slate-400">{{ description }}</p>
    <div v-if="slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
