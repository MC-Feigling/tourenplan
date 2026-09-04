<script setup lang="ts">
</script>

<template>
  <p class="sr-only" role="status">Laden…</p>
  <div class="space-y-6 animate-pulse" aria-hidden="true">
    <div class="flex items-center justify-between gap-4">
      <div class="h-8 w-48 rounded-lg bg-white/10" />
      <div class="h-8 w-40 rounded-lg bg-white/10" />
    </div>
    <div class="grid gap-3 lg:grid-cols-[1fr_16rem]">
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <div
          v-for="n in 7"
          :key="n"
          class="min-h-40 rounded-xl border border-white/5 bg-white/5 p-3"
        >
          <div class="mb-3 h-3 w-16 rounded bg-white/10" />
          <div class="space-y-2">
            <div class="h-16 rounded-lg bg-white/10" />
            <div class="h-16 rounded-lg bg-white/5" />
          </div>
        </div>
      </div>
      <div class="space-y-3 rounded-xl border border-white/5 bg-white/5 p-3">
        <div class="h-3 w-24 rounded bg-white/10" />
        <div class="h-10 rounded-lg bg-white/10" />
        <div class="h-10 rounded-lg bg-white/10" />
        <div class="h-10 rounded-lg bg-white/5" />
      </div>
    </div>
  </div>
</template>
