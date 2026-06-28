const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

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
