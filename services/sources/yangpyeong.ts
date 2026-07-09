import { parseYangpyeongPage } from '@/lib/parsers/yangpyeong'
import type { DayAvailability } from '@/types/tennis'

const PAGE_URL = 'https://srent.y-sisul.or.kr/page/rent/s04.od.list.asp'

// 페이지는 sch_sym=YYYY-MM 파라미터로 해당 월 달력을 통째로 렌더링한다 (이전/다음달 링크에서 확인)
export async function fetchYangpyeongDaily(date: string): Promise<DayAvailability> {
  try {
    const schSym = date.slice(0, 7)
    const res = await fetch(`${PAGE_URL}?sch_sym=${schSym}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return { date, kind: 'unavailable', loadError: true }
    // 서버는 UTF-8 선언이지만 일부 정적 콘텐츠에 EUC-KR bytes 혼재
    // ArrayBuffer로 읽어 잘못된 바이트는 replacement character로 처리
    const buffer = await res.arrayBuffer()
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
    return parseYangpyeongPage(html, date)
  } catch {
    return { date, kind: 'unavailable', loadError: true }
  }
}
