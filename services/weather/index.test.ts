import { describe, it, expect, vi, beforeEach } from 'vitest'
import { kmaWeatherProvider } from './index'

function mockFetchOnce(items: unknown[]) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ response: { body: { items: { item: items } } } }),
  } as Response)
}

describe('kmaWeatherProvider.getHint', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    process.env.WEATHER_API_KEY = 'test-key'
  })

  it('같은 좌표·날짜에 여러 시간블록을 동시 요청해도 실제 fetch는 한 번만 호출한다', async () => {
    mockFetchOnce([
      { category: 'POP', fcstDate: '20260901', fcstTime: '0800', fcstValue: '20' },
      { category: 'PCP', fcstDate: '20260901', fcstTime: '0800', fcstValue: '강수없음' },
      { category: 'POP', fcstDate: '20260901', fcstTime: '1400', fcstValue: '70' },
      { category: 'PCP', fcstDate: '20260901', fcstTime: '1400', fcstValue: '5.0' },
    ])

    const [morning, afternoon] = await Promise.all([
      kmaWeatherProvider.getHint(37.5714, 126.9769, '2026-09-01', 6, 10),
      kmaWeatherProvider.getHint(37.5714, 126.9769, '2026-09-01', 12, 16),
    ])

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(morning.pop).toBe(20)
    expect(afternoon.pop).toBe(70)
  })

  it('fetch 실패 시 기본 힌트(clear)를 반환한다', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))

    const hint = await kmaWeatherProvider.getHint(37.1, 127.1, '2026-09-02', 6, 8)

    expect(hint).toMatchObject({ hourFrom: 6, hourTo: 8, pop: 0, precip: 0, tier: 'clear' })
  })

  it('응답이 ok가 아니면 기본 힌트(clear)를 반환한다', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

    const hint = await kmaWeatherProvider.getHint(37.2, 127.2, '2026-09-03', 6, 8)

    expect(hint).toMatchObject({ hourFrom: 6, hourTo: 8, pop: 0, precip: 0, tier: 'clear' })
  })
})
