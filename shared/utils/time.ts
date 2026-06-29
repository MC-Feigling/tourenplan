const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const MONTH_SHORT = ['Jan.', 'Feb.', 'Mär.', 'Apr.', 'Mai', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'] as const

export function parseIsoDate(value: string): Date {
  return new Date(`${value}T12:00:00`)
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
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

export function getWeekRangeForDate(isoDate: string): { from: string; to: string } {
  const from = getMondayOfWeek(isoDate)
  return { from, to: addDays(from, 6) }
}

export function formatShortDateLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTH_SHORT[date.getMonth()]
  return `${day}. ${month}`
}

export function formatWeekdayShortDateLabel(isoDate: string, weekdayLabel: string): string {
  const date = parseIsoDate(isoDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${weekdayLabel}. ${day}.${month}.`
}

export function formatWeekRangeLabel(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso)
  const end = parseIsoDate(endIso)
  return `${formatShortDateLabel(start)} – ${formatShortDateLabel(end)} ${end.getFullYear()}`
}

export function formatLongDateLabel(isoDate: string, weekdayLabel: string): string {
  const date = parseIsoDate(isoDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTH_SHORT[date.getMonth()]
  return `${weekdayLabel}, ${day}. ${month}`
}

export function addMinutesToTime(time: string, minutes: number): string {
  const match = TIME_REGEX.exec(time)
  if (!match) return time
  const h = Number(match[1])
  const m = Number(match[2])
  const total = h * 60 + m + minutes
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const hh = Math.floor(wrapped / 60)
  const mm = wrapped % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function diffMinutes(fromTime: string, toTime: string): number {
  const parse = (time: string) => {
    const match = TIME_REGEX.exec(time)
    if (!match) return 0
    return Number(match[1]) * 60 + Number(match[2])
  }
  const a = parse(fromTime)
  const b = parse(toTime)
  return b >= a ? b - a : 24 * 60 - a + b
}

export function minutesToRoundedHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
