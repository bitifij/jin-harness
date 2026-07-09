import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aggregateCourts } from './aggregate'
import { fetchGytennisDaily } from '@/services/sources/gytennis'
import { fetchYangpyeongDaily } from '@/services/sources/yangpyeong'
import { fetchYeyakCalendar } from '@/services/sources/yeyak'
import { kmaWeatherProvider } from '@/services/weather'
import { YEOUIDO_FALLBACK } from '@/config/courts'

vi.mock('@/services/sources/gytennis')
vi.mock('@/services/sources/yangpyeong')
vi.mock('@/services/sources/yeyak')
vi.mock('@/services/weather')

const DATE = '2026-07-09'

describe('aggregateCourts', () => {
  beforeEach(() => {
    vi.mocked(kmaWeatherProvider.getHint).mockResolvedValue({
      hourFrom: 6,
      hourTo: 8,
      tier: 'clear',
      pop: 0,
      precip: 0,
    })
  })

  it('반경 내 코트만, 거리순으로 반환한다', async () => {
    vi.mocked(fetchGytennisDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYangpyeongDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYeyakCalendar).mockResolvedValue({ date: DATE, kind: 'count', remaining: 3, capacity: 10 })

    const result = await aggregateCourts(YEOUIDO_FALLBACK.lat, YEOUIDO_FALLBACK.lng, 10, [DATE])

    expect(result.length).toBeGreaterThan(0)
    for (const court of result) expect(court.distanceKm).toBeLessThanOrEqual(10)
    const distances = result.map((c) => c.distanceKm)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
  })

  it('한 소스가 실패해도 다른 코트는 정상 반환되고 실패 코트는 loadError로 표시된다', async () => {
    vi.mocked(fetchGytennisDaily).mockResolvedValue({ date: DATE, kind: 'unavailable', loadError: true })
    vi.mocked(fetchYangpyeongDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYeyakCalendar).mockResolvedValue({ date: DATE, kind: 'count', remaining: 3, capacity: 10 })

    const result = await aggregateCourts(YEOUIDO_FALLBACK.lat, YEOUIDO_FALLBACK.lng, 50, [DATE])

    const gytennisCourt = result.find((c) => c.source === 'gytennis')
    const yangpyeongCourt = result.find((c) => c.source === 'yangpyeong')
    expect(gytennisCourt?.availability[DATE].loadError).toBe(true)
    expect(yangpyeongCourt?.availability[DATE].loadError).toBeFalsy()
  })

  it('각 코트에 날짜별 현황과 날씨 블록이 포함된다', async () => {
    vi.mocked(fetchGytennisDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYangpyeongDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYeyakCalendar).mockResolvedValue({ date: DATE, kind: 'count', remaining: 3, capacity: 10 })

    const result = await aggregateCourts(YEOUIDO_FALLBACK.lat, YEOUIDO_FALLBACK.lng, 50, [DATE])

    for (const court of result) {
      expect(court.availability[DATE]).toBeDefined()
      expect(court.weather[DATE].length).toBeGreaterThan(0)
      expect(court.weather[DATE][0].tier).toBe('clear')
    }
  })

  it('gytennis 코트의 딥링크 경로에서 실제 사이트 경로와 같은 코트 ID를 추출해 fetchGytennisDaily에 전달한다', async () => {
    // 예약 링크는 실제 사이트 경로(/daily/{id})와 같은 형식이어야 하고,
    // 데이터 수집도 그 경로에서 ID를 뽑아 같은 코트를 조회해야 한다 (딥링크·수집 경로 불일치 방지)
    vi.mocked(fetchGytennisDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYangpyeongDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYeyakCalendar).mockResolvedValue({ date: DATE, kind: 'count', remaining: 3, capacity: 10 })

    const result = await aggregateCourts(YEOUIDO_FALLBACK.lat, YEOUIDO_FALLBACK.lng, 50, [DATE])

    const court1 = result.find((c) => c.id === 'gytennis-1')
    expect(court1?.bookingLinks[0].urlTemplate).toMatch(/\/daily\/1\/\{date\}$/)
    expect(fetchGytennisDaily).toHaveBeenCalledWith('1', DATE)
  })

  it('yeyak 잔여 조회는 날짜의 요일유형에 맞는 예약 ID로 요청한다', async () => {
    // 평일/주말 회차가 서로 다른 rsv_svc_id로 발급되므로, 조회 날짜의 요일에 맞는 ID를 골라야
    // 카드에 표시되는 잔여 면수가 사용자가 예약할 회차와 일치한다
    vi.mocked(fetchGytennisDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYangpyeongDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYeyakCalendar).mockResolvedValue({ date: DATE, kind: 'count', remaining: 3, capacity: 10 })

    const wednesday = '2026-07-08'
    const saturday = '2026-07-11'
    const result = await aggregateCourts(YEOUIDO_FALLBACK.lat, YEOUIDO_FALLBACK.lng, 50, [wednesday, saturday])

    const jamwon = result.find((c) => c.id === 'yeyak-jamwon')
    expect(jamwon).toBeDefined()
    const weekdayId = new URL(jamwon!.bookingLinks.find((l) => l.dayType === 'weekday')!.urlTemplate).searchParams.get('rsv_svc_id')
    const weekendId = new URL(jamwon!.bookingLinks.find((l) => l.dayType === 'weekend')!.urlTemplate).searchParams.get('rsv_svc_id')
    expect(weekdayId).not.toBe(weekendId)
    expect(fetchYeyakCalendar).toHaveBeenCalledWith(weekdayId, wednesday)
    expect(fetchYeyakCalendar).toHaveBeenCalledWith(weekendId, saturday)
  })

  it('hidden 코트는 반경 내에 있어도 목록에서 제외된다', async () => {
    vi.mocked(fetchGytennisDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYangpyeongDaily).mockResolvedValue({ date: DATE, kind: 'slot', slots: [] })
    vi.mocked(fetchYeyakCalendar).mockResolvedValue({ date: DATE, kind: 'count', remaining: 3, capacity: 10 })

    // 싱글턴 config를 mutate하지 않도록 복제본을 주입한다
    const { courts } = await import('@/config/courts')
    const cloned = courts.map((c) =>
      c.id === 'yangpyeong-1' ? { ...c, hidden: true, hiddenReason: '테스트용 숨김' } : c,
    )
    const result = await aggregateCourts(YEOUIDO_FALLBACK.lat, YEOUIDO_FALLBACK.lng, 50, [DATE], cloned)
    expect(result.find((c) => c.id === 'yangpyeong-1')).toBeUndefined()
    expect(result.length).toBeGreaterThan(0)
  })
})
