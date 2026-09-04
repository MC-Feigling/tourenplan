# UX-Fundament Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Post-MVP UX polish — Disposition Empty/Skeleton/Konflikte, Fahrer Maps+Status+Heute-Empty, Passwort ändern.

**Architecture:** Pure shared utils first (TDD), then thin UI/API layers on existing Nuxt monolith. No new domains, no schema migrations except password hash update via existing `users` table.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Zod, bcryptjs, Vitest, Bun, Tailwind, Nuxt UI

**Spec:** `docs/superpowers/specs/2026-09-04-ux-fundament-design.md`

## Global Constraints

- Bun only (`bun run test`, `bun add` — never npm/pnpm/yarn)
- TypeScript strict, no `any`
- Vue: `<script setup lang="ts">`, Composition API
- User-facing copy: German; code/identifiers: English
- No Playwright in this package
- No CSV/Push/PDF/Schnellanlage/Light-Theme/Nutzer-CRUD
- `CHANGE_PASSWORD_MIN_LENGTH = 8`
- Maps: Google Maps dir URL; hide button when no destination
- Skeleton only on initial load; refresh keeps data + „Aktualisiere…“
- Konflikte via existing `summarizeTourAssignment` — no new engine

## File Structure

| File | Responsibility |
|------|----------------|
| `shared/utils/mapsNav.ts` | `buildMapsNavUrl` |
| `shared/utils/mapsNav.test.ts` | Unit tests |
| `shared/assignment/weekConflicts.ts` | `aggregateWeekConflicts` |
| `shared/assignment/weekConflicts.test.ts` | Unit tests |
| `shared/assignment/index.ts` | Re-export weekConflicts |
| `shared/constants/auth.ts` | Password min length + auth UI messages |
| `shared/schemas/auth.ts` | `changePasswordBodySchema` |
| `shared/schemas/auth.test.ts` | Schema tests |
| `shared/constants/driver.ts` | Status success labels |
| `components/dispatcher/WeekPlannerSkeleton.vue` | Initial-load placeholder |
| `components/dispatcher/WeekConflictSummary.vue` | Compact conflict bar |
| `components/dispatcher/WeekPlanner.vue` | Wire empty, conflicts, highlight |
| `components/dispatcher/WeekPlannerGrid.vue` | Pass `highlightedTourIds` |
| `components/dispatcher/TourCard.vue` | Highlight ring |
| `pages/dispatcher/index.vue` | Skeleton on initial load |
| `components/driver/DriverStopTimeline.vue` | Navigieren link |
| `pages/driver/index.vue` | UiEmptyState heute/woche |
| `pages/driver/tours/[id].vue` | Success alert after status |
| `server/api/auth/change-password.post.ts` | Password change API |
| `pages/account.vue` | Account form |
| `components/AppHeader.vue` | Konto link |
| `stores/auth.ts` | Optional `changePassword` helper |

---

### Task 1: buildMapsNavUrl

**Files:**
- Create: `shared/utils/mapsNav.ts`
- Create: `shared/utils/mapsNav.test.ts`

**Interfaces:**
- Consumes: none
- Produces: `buildMapsNavUrl(input: MapsNavInput): string | null`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { buildMapsNavUrl } from './mapsNav'

describe('buildMapsNavUrl', () => {
  it('prefers lat/lng over address', () => {
    expect(
      buildMapsNavUrl({ lat: 52.52, lng: 13.405, address: 'Berlin' }),
    ).toBe('https://www.google.com/maps/dir/?api=1&destination=52.52,13.405')
  })

  it('uses address when coords missing', () => {
    expect(
      buildMapsNavUrl({ lat: null, lng: null, address: 'Hauptstr. 1, Berlin' }),
    ).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=Hauptstr.%201%2C%20Berlin',
    )
  })

  it('accepts string coords', () => {
    expect(
      buildMapsNavUrl({ lat: '48.1', lng: '11.5', address: '' }),
    ).toBe('https://www.google.com/maps/dir/?api=1&destination=48.1,11.5')
  })

  it('returns null when empty', () => {
    expect(buildMapsNavUrl({ lat: null, lng: null, address: '  ' })).toBeNull()
    expect(buildMapsNavUrl({ lat: 52, lng: null, address: '' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test shared/utils/mapsNav.test.ts`

Expected: FAIL (module not found / export missing)

- [ ] **Step 3: Write minimal implementation**

```ts
export type MapsNavInput = {
  lat: number | string | null | undefined
  lng: number | string | null | undefined
  address?: string | null
}

function hasCoord(value: number | string | null | undefined): value is number | string {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return Number.isFinite(value)
  return value.trim() !== '' && Number.isFinite(Number(value))
}

export function buildMapsNavUrl(input: MapsNavInput): string | null {
  if (hasCoord(input.lat) && hasCoord(input.lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${input.lat},${input.lng}`
  }
  const address = input.address?.trim() ?? ''
  if (!address) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test shared/utils/mapsNav.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add shared/utils/mapsNav.ts shared/utils/mapsNav.test.ts
git commit -m "feat: add buildMapsNavUrl utility"
```

---

### Task 2: aggregateWeekConflicts

**Files:**
- Create: `shared/assignment/weekConflicts.ts`
- Create: `shared/assignment/weekConflicts.test.ts`
- Modify: `shared/assignment/index.ts` (re-export)

**Interfaces:**
- Consumes: `summarizeTourAssignment`, `AssignmentResources`, `PublicTour`
- Produces: `aggregateWeekConflicts(tours, resources): WeekConflictSummary`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { aggregateWeekConflicts } from './weekConflicts'
import type { AssignmentResources } from './weekSummary'
import type { PublicTour } from '../types/tours'

function stop(overrides: Partial<PublicTour['stops'][0]> = {}): PublicTour['stops'][0] {
  return {
    id: 's1',
    tourId: 't1',
    sequence: 0,
    locationName: 'A',
    address: '',
    lat: null,
    lng: null,
    plannedArrival: '08:00',
    plannedDeparture: '08:10',
    stopType: 'pickup',
    drivingMinutesFromPrev: 0,
    ...overrides,
  }
}

function tour(overrides: Partial<PublicTour> & { id: string; date: string }): PublicTour {
  return {
    depotId: null,
    type: 'occasional',
    name: overrides.name ?? overrides.id,
    status: 'assigned',
    complianceProfile: 'STANDARD_561_2006',
    lineLengthKm: null,
    lineTemplateId: null,
    vehicleId: null,
    driverId: null,
    notes: '',
    totalDrivingMinutes: 0,
    stops: [stop({ tourId: overrides.id }), stop({ id: 's2', tourId: overrides.id, sequence: 1, plannedArrival: '10:00', plannedDeparture: '10:10' })],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  }
}

const resources: AssignmentResources = {
  drivers: [
    {
      id: 'd1',
      fullName: 'Max',
      active: true,
      licenseClasses: ['D'],
      onLeave: false,
    },
  ],
  vehicles: [
    {
      id: 'v1',
      plateNumber: 'B-TP 1',
      name: 'Bus',
      seats: 50,
      status: 'available',
      vehicleClass: 'coach',
    },
  ],
  leaveRequests: [],
}

describe('aggregateWeekConflicts', () => {
  it('returns empty when no resources', () => {
    expect(aggregateWeekConflicts([tour({ id: 't1', date: '2026-09-01' })], null)).toEqual({
      count: 0,
      dates: [],
      tourIds: [],
    })
  })

  it('counts tours with double-booked driver as conflicts', () => {
    const a = tour({
      id: 't1',
      date: '2026-09-01',
      name: 'A',
      driverId: 'd1',
      vehicleId: 'v1',
    })
    const b = tour({
      id: 't2',
      date: '2026-09-01',
      name: 'B',
      driverId: 'd1',
      vehicleId: null,
      stops: [
        stop({ id: 'b1', tourId: 't2', plannedArrival: '08:30', plannedDeparture: '08:40' }),
        stop({ id: 'b2', tourId: 't2', sequence: 1, plannedArrival: '09:30', plannedDeparture: '09:40' }),
      ],
    })
    const result = aggregateWeekConflicts([a, b], resources)
    expect(result.count).toBeGreaterThanOrEqual(1)
    expect(result.tourIds.length).toBeGreaterThanOrEqual(1)
    expect(result.dates).toContain('2026-09-01')
  })

  it('ignores ok tours', () => {
    const alone = tour({
      id: 't1',
      date: '2026-09-02',
      driverId: 'd1',
      vehicleId: 'v1',
    })
    const result = aggregateWeekConflicts([alone], resources)
    expect(result.count).toBe(0)
    expect(result.tourIds).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test shared/assignment/weekConflicts.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```ts
import type { PublicTour } from '../types/tours'
import { summarizeTourAssignment, type AssignmentResources } from './weekSummary'

export type WeekConflictSummary = {
  count: number
  dates: string[]
  tourIds: string[]
}

export function aggregateWeekConflicts(
  tours: PublicTour[],
  resources: AssignmentResources | null,
): WeekConflictSummary {
  if (!resources) {
    return { count: 0, dates: [], tourIds: [] }
  }

  const tourIds: string[] = []
  const dateSet = new Set<string>()

  for (const tour of tours) {
    const result = summarizeTourAssignment(tour, tours, resources)
    if (result.status === 'error' || result.status === 'warning') {
      tourIds.push(tour.id)
      dateSet.add(tour.date)
    }
  }

  return {
    count: tourIds.length,
    dates: [...dateSet].sort(),
    tourIds,
  }
}
```

Also add to `shared/assignment/index.ts`:

```ts
export * from './weekConflicts'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test shared/assignment/weekConflicts.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add shared/assignment/weekConflicts.ts shared/assignment/weekConflicts.test.ts shared/assignment/index.ts
git commit -m "feat: aggregate week assignment conflicts"
```

---

### Task 3: Auth password schema + constants

**Files:**
- Modify: `shared/constants/auth.ts`
- Create: `shared/schemas/auth.ts`
- Create: `shared/schemas/auth.test.ts`
- Modify: `shared/constants/driver.ts` (success labels)

**Interfaces:**
- Produces: `CHANGE_PASSWORD_MIN_LENGTH`, `AUTH_MESSAGES`, `changePasswordBodySchema`, `DRIVER_STATUS_SUCCESS_LABELS`

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from 'vitest'
import { changePasswordBodySchema } from './auth'

describe('changePasswordBodySchema', () => {
  it('accepts valid payload', () => {
    const parsed = changePasswordBodySchema.parse({
      currentPassword: 'old-secret',
      newPassword: 'new-secret1',
    })
    expect(parsed.newPassword).toBe('new-secret1')
  })

  it('rejects short new password', () => {
    expect(() =>
      changePasswordBodySchema.parse({
        currentPassword: 'old-secret',
        newPassword: 'short',
      }),
    ).toThrow()
  })

  it('rejects when new equals current', () => {
    expect(() =>
      changePasswordBodySchema.parse({
        currentPassword: 'same-pass',
        newPassword: 'same-pass',
      }),
    ).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test shared/schemas/auth.test.ts`

Expected: FAIL

- [ ] **Step 3: Implement constants + schema**

Append to `shared/constants/auth.ts`:

```ts
export const CHANGE_PASSWORD_MIN_LENGTH = 8

export const AUTH_MESSAGES = {
  changePasswordSuccess: 'Passwort geändert',
  wrongCurrentPassword: 'Aktuelles Passwort ist falsch',
  passwordTooShort: 'Neues Passwort zu kurz',
  passwordUnchanged: 'Neues Passwort muss sich unterscheiden',
  changePasswordFailed: 'Passwort konnte nicht geändert werden',
} as const
```

Create `shared/schemas/auth.ts`:

```ts
import { z } from 'zod'
import { CHANGE_PASSWORD_MIN_LENGTH } from '../constants/auth'

export const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(CHANGE_PASSWORD_MIN_LENGTH).max(128),
  })
  .refine((body) => body.newPassword !== body.currentPassword, {
    message: 'password_unchanged',
    path: ['newPassword'],
  })
```

Append to `shared/constants/driver.ts`:

```ts
export const DRIVER_STATUS_SUCCESS_LABELS: Partial<Record<TourStatus, string>> = {
  active: 'Tour gestartet',
  completed: 'Tour abgeschlossen',
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test shared/schemas/auth.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add shared/constants/auth.ts shared/schemas/auth.ts shared/schemas/auth.test.ts shared/constants/driver.ts
git commit -m "feat: add change-password schema and UI messages"
```

---

### Task 4: Disposition skeleton + empty state

**Files:**
- Create: `components/dispatcher/WeekPlannerSkeleton.vue`
- Modify: `pages/dispatcher/index.vue`
- Modify: `components/dispatcher/WeekPlanner.vue`

**Interfaces:**
- Consumes: `UiEmptyState`, existing week props
- Produces: skeleton on initial load; empty CTA when no tours

- [ ] **Step 1: Add `WeekPlannerSkeleton.vue`**

```vue
<script setup lang="ts">
</script>

<template>
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
```

- [ ] **Step 2: Wire skeleton in `pages/dispatcher/index.vue`**

Replace the initial-loading text branch with:

```vue
<DispatcherWeekPlannerSkeleton v-if="isInitialLoading" />
```

Keep error branch and `isRefreshing` text as-is.

- [ ] **Step 3: Empty state inside `WeekPlanner.vue`**

After the toolbar (and before grid), when `tours.length === 0`:

```vue
<UiEmptyState
  v-if="tours.length === 0"
  title="Keine Touren in dieser Woche"
  description="Generiere Linien oder lege einen Ausflug an."
>
  <template #icon>
    <svg class="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  </template>
  <template #action>
    <div class="flex flex-wrap justify-center gap-2">
      <UButton to="/dispatcher/lines" variant="ghost" color="neutral">Linien</UButton>
      <UButton :to="`/dispatcher/tours/new?date=${selectedDate || weekStart}`" color="primary">
        + Ausflug
      </UButton>
    </div>
  </template>
</UiEmptyState>
```

Still render the grid/sidebar when empty is fine OR hide grid when empty — prefer: show empty instead of empty day columns (hide `WeekPlannerGrid` when `tours.length === 0`).

- [ ] **Step 4: Manual smoke**

Run: `bun run dev` → open `/dispatcher` as dispatcher with empty week → see EmptyState + CTAs; with slow network refresh → skeleton only on first paint.

- [ ] **Step 5: Commit**

```bash
git add components/dispatcher/WeekPlannerSkeleton.vue components/dispatcher/WeekPlanner.vue pages/dispatcher/index.vue
git commit -m "feat: add dispatcher week skeleton and empty state"
```

---

### Task 5: WeekConflictSummary + card highlight

**Files:**
- Create: `components/dispatcher/WeekConflictSummary.vue`
- Modify: `components/dispatcher/WeekPlanner.vue`
- Modify: `components/dispatcher/WeekPlannerGrid.vue`
- Modify: `components/dispatcher/TourCard.vue`

**Interfaces:**
- Consumes: `aggregateWeekConflicts`
- Produces: conflict bar + highlight toggle on tour cards

- [ ] **Step 1: Create `WeekConflictSummary.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{
  count: number
  dateLabels: string[]
  active: boolean
}>()

defineEmits<{
  toggle: []
}>()

const summaryText = computed(() => {
  if (props.count === 0) return ''
  const days = props.dateLabels.length ? ` · ${props.dateLabels.join(', ')}` : ''
  return `${props.count} Konflikt${props.count === 1 ? '' : 'e'}${days}`
})
</script>

<template>
  <button
    v-if="count > 0"
    type="button"
    class="flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors"
    :class="active
      ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
      : 'border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15'"
    @click="$emit('toggle')"
  >
    <span>{{ summaryText }}</span>
    <span class="text-xs opacity-80">{{ active ? 'Hervorhebung aus' : 'Hervorheben' }}</span>
  </button>
</template>
```

- [ ] **Step 2: Wire aggregation in `WeekPlanner.vue`**

```ts
import { aggregateWeekConflicts } from '~/shared/assignment/weekConflicts'

const highlightConflicts = ref(false)

const weekConflicts = computed(() =>
  aggregateWeekConflicts(props.tours, props.assignmentResources),
)

const conflictDateLabels = computed(() =>
  weekConflicts.value.dates.map((date) => {
    const day = props.weekDays.find((item) => item.date === date)
    return day?.label?.slice(0, 2) ?? date.slice(5)
  }),
)

const highlightedTourIds = computed(() =>
  highlightConflicts.value ? new Set(weekConflicts.value.tourIds) : new Set<string>(),
)
```

In template (after toolbar / feedback, before empty or grid):

```vue
<DispatcherWeekConflictSummary
  :count="weekConflicts.count"
  :date-labels="conflictDateLabels"
  :active="highlightConflicts"
  @toggle="highlightConflicts = !highlightConflicts"
/>
```

Pass `:highlighted-tour-ids="highlightedTourIds"` to `WeekPlannerGrid`.

- [ ] **Step 3: Propagate highlight to `TourCard`**

In `WeekPlannerGrid.vue`: add prop `highlightedTourIds: Set<string>` and pass `:highlighted="highlightedTourIds.has(tour.id)"` to each tour card.

In `TourCard.vue`: add optional `highlighted?: boolean` and extend `:class`:

```ts
highlighted ? 'ring-2 ring-amber-400/50 border-amber-500/30' : '',
```

- [ ] **Step 4: Smoke-check**

Create overlapping driver assignment in UI or via API; conflict bar appears; toggle highlights cards.

- [ ] **Step 5: Commit**

```bash
git add components/dispatcher/WeekConflictSummary.vue components/dispatcher/WeekPlanner.vue components/dispatcher/WeekPlannerGrid.vue components/dispatcher/TourCard.vue
git commit -m "feat: show compact week conflict summary"
```

---

### Task 6: Fahrer Maps + Status + Heute-Empty

**Files:**
- Modify: `components/driver/DriverStopTimeline.vue`
- Modify: `pages/driver/tours/[id].vue`
- Modify: `pages/driver/index.vue`

**Interfaces:**
- Consumes: `buildMapsNavUrl`, `DRIVER_STATUS_SUCCESS_LABELS`
- Produces: Navigieren links; success alert; UiEmptyState for today

- [ ] **Step 1: Update `DriverStopTimeline.vue`**

```vue
<script setup lang="ts">
import { STOP_TYPE_LABELS } from '~/shared/constants/tours'
import type { PublicTourStop } from '~/shared/types/tours'
import { buildMapsNavUrl } from '~/shared/utils/mapsNav'

defineProps<{
  stops: PublicTourStop[]
}>()

function navUrl(stop: PublicTourStop): string | null {
  return buildMapsNavUrl({
    lat: stop.lat,
    lng: stop.lng,
    address: stop.address,
  })
}
</script>
```

Inside each stop block (after time badges), add:

```vue
<a
  v-if="navUrl(stop)"
  :href="navUrl(stop)!"
  target="_blank"
  rel="noopener noreferrer"
  class="mt-2 inline-flex text-xs font-medium text-brand-300 underline-offset-2 hover:underline"
>
  Navigieren
</a>
```

(Prefer computing URL once in a small child or memoized map if template double-call bothers — acceptable for ≤20 stops.)

- [ ] **Step 2: Status success on tour detail**

In `pages/driver/tours/[id].vue`:

```ts
import { DRIVER_STATUS_SUCCESS_LABELS } from '~/shared/constants/driver'

const successMessage = ref<string | null>(null)

async function onStatusAction() {
  if (!tour.value || !nextStatus.value) return
  actionError.value = null
  successMessage.value = null
  acting.value = true
  try {
    const target = nextStatus.value
    const res = await api.updateStatus(tour.value.id, target)
    data.value = res
    successMessage.value = DRIVER_STATUS_SUCCESS_LABELS[target] ?? 'Status aktualisiert'
  } catch {
    actionError.value = api.error.value
  } finally {
    acting.value = false
  }
}
```

Template (near actionError alert):

```vue
<UAlert
  v-if="successMessage"
  color="success"
  variant="subtle"
  :title="successMessage"
  role="status"
/>
```

- [ ] **Step 3: Heute EmptyState on `pages/driver/index.vue`**

```ts
const nextTourDate = computed(() => upcomingTours.value[0]?.date ?? null)

const nextTourDateLabel = computed(() => {
  if (!nextTourDate.value) return null
  return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${nextTourDate.value}T12:00:00`))
})
```

Replace the simple „Heute keine Touren“ card with:

```vue
<UiEmptyState
  v-else
  title="Heute keine Tour"
  :description="nextTourDateLabel
    ? `Nächste Tour: ${nextTourDateLabel}`
    : 'In dieser Woche keine weiteren Touren.'"
>
  <template #icon>
    <svg class="h-7 w-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  </template>
</UiEmptyState>
```

Also replace week-empty `UiAppCard` with `UiEmptyState` title „Keine Touren in dieser Woche“.

- [ ] **Step 4: Run unit tests still green**

Run: `bun run test`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/driver/DriverStopTimeline.vue pages/driver/tours/[id].vue pages/driver/index.vue
git commit -m "feat: improve driver maps, status feedback, empty states"
```

---

### Task 7: change-password API

**Files:**
- Create: `server/api/auth/change-password.post.ts`

**Interfaces:**
- Consumes: `requireUserRow`, `changePasswordBodySchema`, `AUTH_MESSAGES`, bcrypt
- Produces: `POST /api/auth/change-password` → `{ ok: true }`

- [ ] **Step 1: Implement API route**

```ts
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { ZodError } from 'zod'
import { AUTH_MESSAGES } from '../../../shared/constants/auth'
import { changePasswordBodySchema } from '../../../shared/schemas/auth'
import { users } from '../../database/schema'
import { requireUserRow } from '../../utils/access'
import { useDb } from '../../utils/db'
import { rateLimitAllow } from '../../utils/rateLimit'
import { getClientIp } from '../../utils/requestMeta'

export default defineEventHandler(async (event) => {
  const ip = getClientIp(event)
  if (!rateLimitAllow('auth', `change-pw:${ip}`)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const row = await requireUserRow(event)

  let body: { currentPassword: string; newPassword: string }
  try {
    body = await readValidatedBody(event, (raw) => changePasswordBodySchema.parse(raw))
  } catch (error) {
    if (error instanceof ZodError) {
      const code = error.issues[0]?.message
      if (code === 'password_unchanged') {
        throw createError({
          statusCode: 400,
          statusMessage: AUTH_MESSAGES.passwordUnchanged,
        })
      }
      throw createError({
        statusCode: 400,
        statusMessage: AUTH_MESSAGES.passwordTooShort,
      })
    }
    throw error
  }

  if (!rateLimitAllow('auth', `change-pw-user:${row.id}`)) {
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }

  const ok = bcrypt.compareSync(body.currentPassword, row.passwordHash)
  if (!ok) {
    throw createError({
      statusCode: 401,
      statusMessage: AUTH_MESSAGES.wrongCurrentPassword,
    })
  }

  const passwordHash = bcrypt.hashSync(body.newPassword, 12)
  const { db } = await useDb()
  await db.update(users).set({ passwordHash }).where(eq(users.id, row.id))

  return { ok: true as const }
})
```

- [ ] **Step 2: Typecheck / build sanity**

Run: `bun run test`  
(Optional if DB up: hit endpoint with curl after login cookie.)

- [ ] **Step 3: Commit**

```bash
git add server/api/auth/change-password.post.ts
git commit -m "feat: add change-password API"
```

---

### Task 8: Account page + Konto nav

**Files:**
- Create: `pages/account.vue`
- Modify: `components/AppHeader.vue`
- Modify: `stores/auth.ts` (add `changePassword`)

**Interfaces:**
- Consumes: `POST /api/auth/change-password`, `AUTH_MESSAGES`, `CHANGE_PASSWORD_MIN_LENGTH`
- Produces: `/account` for all authenticated roles

- [ ] **Step 1: Extend `stores/auth.ts`**

```ts
async function changePassword(currentPassword: string, newPassword: string) {
  const apiFetch = useApiFetch()
  await apiFetch('/api/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
    credentials: 'include',
  })
}
```

Export it from the store return object.

- [ ] **Step 2: Create `pages/account.vue`**

```vue
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
```

If `AdminPageHeader` is admin-only naming but reusable — keep it (already used on dispatcher). Else use a simple `<h1>`.

- [ ] **Step 3: Add Konto link in `AppHeader.vue`**

In the user actions block (before Abmelden):

```vue
<NuxtLink
  to="/account"
  class="rounded-lg px-3 py-2 text-sm text-slate-300 no-underline transition-colors hover:bg-white/5 hover:text-white"
  active-class="!bg-white/10 !text-white"
>
  Konto
</NuxtLink>
```

Works for driver layout too (`AppHeader` already mounted).

- [ ] **Step 4: Verify**

Run: `bun run test`  
Run: `bun run build` (must succeed)  
Manual: login → Konto → wrong current PW → error; valid change → success; re-login with new PW.

- [ ] **Step 5: Commit**

```bash
git add pages/account.vue components/AppHeader.vue stores/auth.ts
git commit -m "feat: add account password change page"
```

---

### Task 9: Final verification + PROJECT_INFO note

**Files:**
- Modify: `PROJECT_INFO.md` (short Post-MVP note)
- Modify: `docs/superpowers/specs/2026-09-04-ux-fundament-design.md` (Status → Approved/Implemented when done)

- [ ] **Step 1: Full test + build**

```bash
bun run test
bun run build
```

Expected: both exit 0

- [ ] **Step 2: Update PROJECT_INFO**

Under MVP-Phasen add:

```md
## Post-MVP

- UX-Fundament: Disposition Empty/Skeleton/Konflikte, Fahrer Maps+Status, Passwort ändern ✅
```

- [ ] **Step 3: Mark spec status Implemented**

Change Status line in design spec to `Implemented`.

- [ ] **Step 4: Commit**

```bash
git add PROJECT_INFO.md docs/superpowers/specs/2026-09-04-ux-fundament-design.md
git commit -m "docs: mark UX fundament package complete"
```

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| Skeleton initial load | 4 |
| Empty week + CTAs lines/new | 4 |
| Conflict aggregation + summary + highlight | 2, 5 |
| Heute EmptyState + next date | 6 |
| Maps deep link | 1, 6 |
| Status success feedback | 3, 6 |
| change-password API | 3, 7 |
| /account + Konto nav | 8 |
| Vitest for utils/schema/conflicts | 1, 2, 3 |
| Unified empty/error patterns | 4, 6, 8 |

## Self-review notes

- No placeholders left in steps
- Types aligned: `WeekConflictSummary`, `MapsNavInput`, `CHANGE_PASSWORD_MIN_LENGTH = 8`
- `newPasswordConfirm` client-only (Task 8)
- Cookie sessions not invalidated (per spec)
