import { parseGytennisDaily } from '@/lib/parsers/gytennis'
import type { DayAvailability } from '@/types/tennis'

// courtId: gytennis 시스템의 코트 번호 (1~10)
export async function fetchGytennisDaily(
  courtId: string | number,
  date: string,
): Promise<DayAvailability> {
  try {
    const url = `https://gytennis.or.kr/daily/${courtId}/${date}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return { date, kind: 'unavailable', loadError: true }
    const html = await res.text()
    return parseGytennisDaily(html, date)
  } catch {
    return { date, kind: 'unavailable', loadError: true }
  }
}
