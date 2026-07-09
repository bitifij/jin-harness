export function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function isWeekday(date: Date): boolean {
  const dow = date.getDay()
  return dow !== 0 && dow !== 6
}

export function isWeekend(date: Date): boolean {
  return !isWeekday(date)
}

function getDatesInRange(from: Date, to: Date, filter: (d: Date) => boolean): string[] {
  const result: string[] = []
  let d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  while (d <= end) {
    if (filter(d)) result.push(toYMD(d))
    d = addDays(d, 1)
  }
  return result
}

export function getWeekdayDates(from: Date, to: Date): string[] {
  return getDatesInRange(from, to, isWeekday)
}

export function getWeekendDates(from: Date, to: Date): string[] {
  return getDatesInRange(from, to, isWeekend)
}
