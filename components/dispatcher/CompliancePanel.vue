<script setup lang="ts">
import type { ComplianceValidationResult } from '~/shared/compliance/types'

defineProps<{
  result: ComplianceValidationResult | null
  loading?: boolean
}>()

const statusClasses = {
  ok: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
}

const statusLabels = {
  ok: 'Konform',
  warning: 'Hinweise',
  error: 'Verstöße',
}

const severityDot = {
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-slate-400',
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-white">Lenkzeit-Prüfung</h2>
      <span
        v-if="result"
        class="rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset"
        :class="statusClasses[result.status]"
      >
        {{ statusLabels[result.status] }}
      </span>
      <span v-else-if="loading" class="text-xs text-slate-500">Prüfe…</span>
    </div>

    <div v-if="result" class="grid gap-2 sm:grid-cols-3">
      <div class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-slate-500">Tour Lenkzeit</p>
        <p class="text-sm font-semibold text-white">{{ result.summary.tourDrivingMinutes }} min</p>
      </div>
      <div class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-slate-500">Arbeitszeit</p>
        <p class="text-sm font-semibold text-white">{{ result.summary.tourWorkMinutes }} min</p>
      </div>
      <div v-if="result.summary.weekDrivingMinutes !== null" class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-slate-500">Woche (Fahrer)</p>
        <p class="text-sm font-semibold text-white">{{ result.summary.weekDrivingMinutes }} min</p>
      </div>
    </div>

    <ul v-if="result?.issues.length" class="space-y-2">
      <li
        v-for="(issue, index) in result.issues"
        :key="`${issue.code}-${index}`"
        class="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
      >
        <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="severityDot[issue.severity]" />
        <span class="text-slate-200">{{ issue.message }}</span>
      </li>
    </ul>

    <p v-else-if="result && result.status === 'ok'" class="text-sm text-slate-400">
      Keine Verstöße gegen Lenkzeitregeln erkannt.
    </p>
  </div>
</template>
