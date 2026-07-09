import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { TennisRadar } from './tennis-radar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { YEOUIDO_FALLBACK } from '@/config/courts'
import { toYMD } from '@/lib/date'
import type { CourtWithAvailability } from '@/services/aggregate'

function renderRadar() {
  return render(<TennisRadar />, { wrapper: TooltipProvider })
}

const sampleCourt: CourtWithAvailability = {
  id: 'gytennis-1',
  name: '대화코트',
  source: 'gytennis',
  lat: 37.66,
  lng: 126.77,
  deepLinkTemplate: 'https://gytennis.or.kr/rsvDaily/1/{date}',
  slotUnitMinutes: 120,
  info: {},
  distanceKm: 3.2,
  availability: {},
  weather: {},
}

function mockFetchOnce(courts: CourtWithAvailability[]) {
  vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ courts }) } as Response)
}

describe('TennisRadar', () => {
  beforeEach(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn((_success, error) => error?.({} as GeolocationPositionError)) },
      configurable: true,
    })
    global.fetch = vi.fn() as unknown as typeof fetch
    mockFetchOnce([sampleCourt])
  })

  it('진입 시 여의도 기본 위치·반경 10km로 /api/courts를 호출하고 결과를 렌더한다', async () => {
    renderRadar()

    await waitFor(() => expect(screen.getByText('대화코트')).toBeInTheDocument())

    const calledUrl = new URL(vi.mocked(fetch).mock.calls[0][0] as string, 'http://localhost')
    expect(calledUrl.pathname).toBe('/api/courts')
    expect(calledUrl.searchParams.get('lat')).toBe(String(YEOUIDO_FALLBACK.lat))
    expect(calledUrl.searchParams.get('lng')).toBe(String(YEOUIDO_FALLBACK.lng))
    expect(calledUrl.searchParams.get('radius')).toBe('10')
    expect(screen.getByText('기본 위치(여의도) 사용 중')).toBeInTheDocument()
  })

  it('반경 컨트롤 변경 시 새 반경으로 /api/courts를 재요청한다', async () => {
    renderRadar()
    await waitFor(() => expect(screen.getByText('대화코트')).toBeInTheDocument())

    const slider = screen.getByRole('slider')
    slider.focus()
    fireEvent.keyDown(slider, { key: 'ArrowRight' })

    await waitFor(() => {
      const lastUrl = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string
      expect(new URL(lastUrl, 'http://localhost').searchParams.get('radius')).toBe('15')
    })
  })

  it('시간 필터 적용 시 겹치지 않는 슬롯 코트가 목록에서 제외되고, 해제 시 복원된다', async () => {
    const today = toYMD(new Date())
    const slotCourt: CourtWithAvailability = {
      ...sampleCourt,
      availability: { [today]: { date: today, kind: 'slot', slots: [{ start: '08:00', end: '10:00', available: true }] } },
    }
    mockFetchOnce([slotCourt])

    renderRadar()
    await waitFor(() => expect(screen.getByText('대화코트')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^시간/ }))
    fireEvent.click(await screen.findByRole('button', { name: '18시-19시' }))
    fireEvent.click(screen.getByRole('button', { name: '적용' }))

    await waitFor(() => expect(screen.queryByText('대화코트')).not.toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^시간/ }))
    fireEvent.click(screen.getByRole('button', { name: '전체 해제' }))
    fireEvent.click(screen.getByRole('button', { name: '적용' }))

    await waitFor(() => expect(screen.getByText('대화코트')).toBeInTheDocument())
  })

  it('/api/courts 요청이 실패하면 빈 목록 대신 에러 안내를 표시한다', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))

    renderRadar()

    await waitFor(() => expect(screen.getByText('코트 정보를 불러오지 못했습니다.')).toBeInTheDocument())
    expect(screen.queryByText('반경 내 코트가 없습니다.')).not.toBeInTheDocument()
  })
})
