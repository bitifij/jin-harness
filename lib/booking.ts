import { isWeekend } from '@/lib/date'
import type { BookingLink } from '@/types/tennis'

function parseYMD(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function pickBookingLink(links: BookingLink[], date: string): BookingLink {
  const dayType = isWeekend(parseYMD(date)) ? 'weekend' : 'weekday'
  return links.find((l) => l.dayType === dayType) ?? links.find((l) => l.dayType === 'all') ?? links[0]
}

export function resolveBookingUrl(link: BookingLink, date: string): string {
  return link.urlTemplate.replace('{date}', date)
}
