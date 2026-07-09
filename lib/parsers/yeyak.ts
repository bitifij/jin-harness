import type { DayAvailability } from '@/types/tennis'

interface YeyakDayTm {
  RESVE_POSBL_CNT: number
  RCRIT_NMPR_CNT: number
}

interface YeyakCalendarResponse {
  resultListTm: Record<string, YeyakDayTm>
}

export function parseYeyakCalendar(json: string, date: string): DayAvailability {
  try {
    const data = JSON.parse(json) as YeyakCalendarResponse
    if (!data.resultListTm) return { date, kind: 'unavailable', loadError: true }

    const ymd = date.replaceAll('-', '')
    const day = data.resultListTm[ymd]
    if (!day) return { date, kind: 'unavailable' }

    return {
      date,
      kind: 'count',
      remaining: day.RESVE_POSBL_CNT,
      capacity: day.RCRIT_NMPR_CNT,
    }
  } catch {
    return { date, kind: 'unavailable', loadError: true }
  }
}
