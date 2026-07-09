import { parse } from 'node-html-parser'
import type { DayAvailability, Slot } from '@/types/tennis'

export function parseYangpyeongPage(html: string, date: string): DayAvailability {
  try {
    const root = parse(html)
    const day = String(parseInt(date.split('-')[2], 10))

    // 날짜 셀: <h6>N</h6> 또는 <h6><span ...>N</span></h6>
    const h6s = root.querySelectorAll('h6')
    let targetH6 = null
    for (const h6 of h6s) {
      if (h6.text.trim() === day) {
        targetH6 = h6
        break
      }
    }

    if (!targetH6) return { date, kind: 'unavailable', loadError: true }

    // h6의 부모 td에서 ul 찾기
    const parentTd = targetH6.parentNode
    const ul = parentTd?.querySelector('ul')
    if (!ul) return { date, kind: 'unavailable', loadError: true }

    const slots: Slot[] = []
    for (const li of ul.querySelectorAll('li')) {
      const text = li.text
      const timeMatch = text.match(/(\d{2}:\d{2})~(\d{2}:\d{2})/)
      if (!timeMatch) continue

      const [, start, end] = timeMatch
      const available = li.querySelector('.status_y') !== null

      slots.push({ start, end, available })
    }

    if (slots.length === 0) return { date, kind: 'unavailable', loadError: true }

    return { date, kind: 'slot', slots }
  } catch {
    return { date, kind: 'unavailable', loadError: true }
  }
}
