import { parseYeyakCalendar } from '@/lib/parsers/yeyak'
import type { DayAvailability } from '@/types/tennis'

// NOTE: 캘린더 ajax 엔드포인트는 실제 사이트 네트워크 요청으로 확인 필요 (미검증)
const CALENDAR_URL = 'https://yeyak.seoul.go.kr/web/reservation/selectDayList.do'

export async function fetchYeyakCalendar(rsvSvcId: string, date: string): Promise<DayAvailability> {
  try {
    const yearMonth = date.slice(0, 7).replaceAll('-', '')
    const res = await fetch(`${CALENDAR_URL}?rsv_svc_id=${rsvSvcId}&searchYm=${yearMonth}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return { date, kind: 'unavailable', loadError: true }
    const json = await res.text()
    return parseYeyakCalendar(json, date)
  } catch {
    return { date, kind: 'unavailable', loadError: true }
  }
}
