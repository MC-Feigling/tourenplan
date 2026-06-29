import { WEEKDAY_LABELS, type IsoWeekday } from '~/shared/constants/tours'
import {
  addDays,
  formatWeekdayShortDateLabel,
  formatWeekRangeLabel,
  getMondayOfWeek,
  parseIsoDate,
  toIsoDate,
} from '~/shared/utils/time'

export { toIsoDate, parseIsoDate, addDays, getMondayOfWeek } from '~/shared/utils/time'

export function useWeekRange() {
  const anchorDate = ref(toIsoDate(new Date()))

  const weekStart = computed(() => getMondayOfWeek(anchorDate.value))
  const weekEnd = computed(() => addDays(weekStart.value, 6))

  const weekLabel = computed(() => formatWeekRangeLabel(weekStart.value, weekEnd.value))

  const weekDays = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart.value, i)
      const d = parseIsoDate(date)
      const weekday = d.getDay() === 0 ? 7 : d.getDay()
      return {
        date,
        weekday,
        label: formatWeekdayShortDateLabel(date, WEEKDAY_LABELS[weekday as IsoWeekday]),
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
