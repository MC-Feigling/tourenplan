<script setup lang="ts">
defineProps<{
  message: string
  tone: 'error' | 'success'
}>()
</script>

<template>
  <p
    class="rounded-xl border px-4 py-2 text-sm"
    :class="
      tone === 'error'
        ? 'border-red-500/30 bg-red-500/10 text-red-300'
        : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
    "
    role="status"
  >
    {{ message }}
  </p>
</template>
