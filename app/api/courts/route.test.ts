import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { aggregateCourts } from '@/services/aggregate'

vi.mock('@/services/aggregate')

describe('GET /api/courts', () => {
  beforeEach(() => {
    vi.mocked(aggregateCourts).mockClear()
  })

  it('lat/lng/radius/dates 쿼리를 파싱해 aggregateCourts에 전달한다', async () => {
    vi.mocked(aggregateCourts).mockResolvedValue([])

    await GET(new Request('http://localhost/api/courts?lat=37.5&lng=127.0&radius=5&dates=2026-07-09,2026-07-10'))

    expect(aggregateCourts).toHaveBeenCalledWith(37.5, 127.0, 5, ['2026-07-09', '2026-07-10'])
  })

  it('쿼리 없으면 여의도 fallback·기본 반경으로 조회한다', async () => {
    vi.mocked(aggregateCourts).mockResolvedValue([])

    await GET(new Request('http://localhost/api/courts'))

    expect(aggregateCourts).toHaveBeenCalledWith(37.5219, 126.9245, 10, expect.any(Array))
  })

  it('aggregateCourts 결과를 courts 필드로 JSON 응답한다', async () => {
    const mockCourts = [{ id: 'gytennis-1', distanceKm: 1.2 }]
    vi.mocked(aggregateCourts).mockResolvedValue(mockCourts as never)

    const res = await GET(new Request('http://localhost/api/courts'))
    const body = await res.json()

    expect(body.courts).toEqual(mockCourts)
  })

  it('lat/lng/radius가 숫자가 아니면 400을 반환하고 aggregateCourts를 호출하지 않는다', async () => {
    const res = await GET(new Request('http://localhost/api/courts?lat=abc&lng=127.0&radius=5'))

    expect(res.status).toBe(400)
    expect(aggregateCourts).not.toHaveBeenCalled()
  })

  it('radius가 0 이하이면 400을 반환한다', async () => {
    const res = await GET(new Request('http://localhost/api/courts?lat=37.5&lng=127.0&radius=0'))

    expect(res.status).toBe(400)
    expect(aggregateCourts).not.toHaveBeenCalled()
  })
})
