export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00`)
}

export function addDays(isoDate: string, days: number): string {
  const d = parseIsoDate(isoDate)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export function getMondayOfWeek(isoDate: string): string {
  const d = parseIsoDate(isoDate)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toIsoDate(d)
}

export function useWeekRange() {
  const anchorDate = ref(toIsoDate(new Date()))

  const weekStart = computed(() => getMondayOfWeek(anchorDate.value))
  const weekEnd = computed(() => addDays(weekStart.value, 6))

  const weekLabel = computed(() => {
    const start = parseIsoDate(weekStart.value)
    const end = parseIsoDate(weekEnd.value)
    const fmt = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'short' })
    return `${fmt.format(start)} – ${fmt.format(end)} ${end.getFullYear()}`
  })

  const weekDays = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart.value, i)
      const d = parseIsoDate(date)
      const weekday = d.getDay() === 0 ? 7 : d.getDay()
      return {
        date,
        weekday,
        label: new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(d),
        isToday: date === toIsoDate(new Date()),
      }
    }),
  )

  function shiftWeek(delta: number) {
    anchorDate.value = addDays(anchorDate.value, delta * 7)
  }

  function goToToday() {
    anchorDate.value = toIsoDate(new Date())
  }

  return { anchorDate, weekStart, weekEnd, weekLabel, weekDays, shiftWeek, goToToday }
}
