import { parse } from 'node-html-parser'
import type { DayAvailability, Slot } from '@/types/tennis'

export function parseYangpyeongPage(html: string, date: string): DayAvailability {
  try {
    const root = parse(html)
    const [year, month, dayStr] = date.split('-')
    const day = String(parseInt(dayStr, 10))

    // 페이지는 sch_sym으로 요청한 월의 달력을 통째로 렌더링한다. 서버가 파라미터를
    // 무시하거나 포맷이 바뀌면 같은 일자(h6 텍스트)가 다른 달의 셀과 오매칭될 수 있으므로,
    // 렌더링된 월(.calendar1_yearmonth strong)이 요청 월과 다르면 fail-closed 한다.
    const renderedMonthText = root.querySelector('.calendar1_yearmonth strong')?.text ?? ''
    const monthMatch = renderedMonthText.match(/(\d{4})\s*\.\s*(\d{1,2})/)
    if (!monthMatch || monthMatch[1] !== year || parseInt(monthMatch[2], 10) !== parseInt(month, 10)) {
      return { date, kind: 'unavailable', loadError: true }
    }

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
