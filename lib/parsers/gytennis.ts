import { parse } from 'node-html-parser'
import type { DayAvailability, Slot } from '@/types/tennis'

const SLOT_TIMES: [string, string][] = [
  ['06:00', '08:00'],
  ['08:00', '10:00'],
  ['10:00', '12:00'],
  ['12:00', '14:00'],
  ['14:00', '16:00'],
  ['16:00', '18:00'],
  ['18:00', '20:00'],
  ['20:00', '22:00'],
]

export function parseGytennisDaily(html: string, date: string): DayAvailability {
  try {
    const root = parse(html)
    const innerTables = root.querySelectorAll('.innerCustom')

    if (innerTables.length === 0) {
      return { date, kind: 'unavailable', loadError: true }
    }

    // 각 면(코트)의 슬롯별 available 여부
    const courtAvailability: boolean[][] = innerTables.map(table => {
      const resTags = table.querySelectorAll('.resTag')
      return resTags.map(tag => tag.querySelector('.public-empty-slot') !== null)
    })

    // 한 시간대에 ≥1면 available이면 해당 슬롯을 available로 집계
    const slots: Slot[] = SLOT_TIMES.map(([start, end], i) => ({
      start,
      end,
      available: courtAvailability.some(court => court[i] === true),
    }))

    return { date, kind: 'slot', slots }
  } catch {
    return { date, kind: 'unavailable', loadError: true }
  }
}
