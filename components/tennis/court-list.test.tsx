import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CourtList } from './court-list'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { CourtWithAvailability } from '@/services/aggregate'

function renderList(courts: CourtWithAvailability[], dates: string[]) {
  return render(<CourtList courts={courts} dates={dates} />, { wrapper: TooltipProvider })
}

const baseCourt: CourtWithAvailability = {
  id: 'gytennis-1',
  name: '대화코트',
  source: 'gytennis',
  lat: 37.66,
  lng: 126.77,
  bookingLinks: [{ dayType: 'all' as const, urlTemplate: 'https://gytennis.or.kr/daily/1/{date}' }],
  slotUnitMinutes: 120,
  info: {},
  distanceKm: 3.2,
  availability: { '2026-07-22': { date: '2026-07-22', kind: 'slot', slots: [] } },
  weather: {},
}

describe('CourtList', () => {
  it('코트가 있으면 카드 목록을 렌더한다', () => {
    renderList([baseCourt], ['2026-07-22'])
    expect(screen.getByText('대화코트')).toBeInTheDocument()
  })

  it('반경 내 코트가 없으면 안내 메시지를 표시한다', () => {
    renderList([], ['2026-07-22'])
    expect(screen.getByText('반경 내 코트가 없습니다.')).toBeInTheDocument()
  })
})
