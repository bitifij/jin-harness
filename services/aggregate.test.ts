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
})
