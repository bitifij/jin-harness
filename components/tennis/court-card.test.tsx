import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourtCard } from './court-card'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { Court, DayAvailability, WeatherHint } from '@/types/tennis'

function renderCard(element: Parameters<typeof render>[0]) {
  return render(element, { wrapper: TooltipProvider })
}

const court: Court = {
  id: 'gytennis-1',
  name: '대화코트',
  source: 'gytennis',
  lat: 37.66,
  lng: 126.77,
  deepLinkTemplate: 'https://gytennis.or.kr/rsvDaily/1/{date}',
  slotUnitMinutes: 120,
  info: { address: '경기 고양시', courtCount: 4, surface: '하드', hours: '06:00~22:00' },
}

const weatherHints: WeatherHint[] = [
  { hourFrom: 14, hourTo: 16, tier: 'clear', pop: 10, precip: 0 },
  { hourFrom: 18, hourTo: 20, tier: 'rain', pop: 60, precip: 2 },
]

describe('CourtCard (슬롯 소스)', () => {
  it('예약가능 시간칩과 날씨 이모지, 슬롯 수 배지를 표시한다', () => {
    const availability: Record<string, DayAvailability> = {
      '2026-07-22': {
        date: '2026-07-22',
        kind: 'slot',
        slots: [
          { start: '14:00', end: '16:00', available: true },
          { start: '18:00', end: '20:00', available: true },
        ],
      },
    }

    renderCard(
      <CourtCard
        court={court}
        distanceKm={8.4}
        dates={['2026-07-22']}
        availability={availability}
        weather={{ '2026-07-22': weatherHints }}
        now={new Date('2026-07-01T09:00:00')}
      />,
    )

    expect(screen.getByText('2슬롯')).toBeInTheDocument()
    expect(screen.getByText(/14-16/)).toBeInTheDocument()
    expect(screen.getByText(/☀️/)).toBeInTheDocument()
    expect(screen.getByText(/🌧️/)).toBeInTheDocument()
  })

  it('마감인 날짜는 칩 없이 마감으로 표시된다', () => {
    const availability: Record<string, DayAvailability> = {
      '2026-07-25': { date: '2026-07-25', kind: 'slot', slots: [{ start: '14:00', end: '16:00', available: false }] },
    }

    renderCard(
      <CourtCard
        court={court}
        distanceKm={8.4}
        dates={['2026-07-25']}
        availability={availability}
        weather={{}}
        now={new Date('2026-07-01T09:00:00')}
      />,
    )

    expect(screen.getByText('마감')).toBeInTheDocument()
    expect(screen.queryByText(/14-16/)).not.toBeInTheDocument()
  })

  it('오늘 15시엔 이전 슬롯이 숨겨지고 이후 슬롯만 보인다', () => {
    const availability: Record<string, DayAvailability> = {
      '2026-07-09': {
        date: '2026-07-09',
        kind: 'slot',
        slots: [
          { start: '14:00', end: '16:00', available: true },
          { start: '18:00', end: '20:00', available: true },
        ],
      },
    }

    renderCard(
      <CourtCard
        court={court}
        distanceKm={1}
        dates={['2026-07-09']}
        availability={availability}
        weather={{}}
        now={new Date('2026-07-09T15:00:00')}
      />,
    )

    expect(screen.queryByText(/14-16/)).not.toBeInTheDocument()
    expect(screen.getByText(/18-20/)).toBeInTheDocument()
  })

  it('오늘 이후 남은 슬롯이 없으면 안내 문구가 표시된다', () => {
    const availability: Record<string, DayAvailability> = {
      '2026-07-09': {
        date: '2026-07-09',
        kind: 'slot',
        slots: [{ start: '14:00', end: '16:00', available: true }],
      },
    }

    renderCard(
      <CourtCard
        court={court}
        distanceKm={1}
        dates={['2026-07-09']}
        availability={availability}
        weather={{}}
        now={new Date('2026-07-09T20:00:00')}
      />,
    )

    expect(screen.getByText('오늘 예약가능 시간대 없음')).toBeInTheDocument()
  })

  it('모든 날짜가 마감이면 예약마감이 표시되고 버튼이 비활성이다', () => {
    const availability: Record<string, DayAvailability> = {
      '2026-07-22': { date: '2026-07-22', kind: 'slot', slots: [] },
      '2026-07-25': { date: '2026-07-25', kind: 'slot', slots: [] },
    }

    renderCard(
      <CourtCard
        court={court}
        distanceKm={1}
        dates={['2026-07-22', '2026-07-25']}
        availability={availability}
        weather={{}}
        now={new Date('2026-07-01T09:00:00')}
      />,
    )

    const button = screen.getByRole('button', { name: '예약마감' })
    expect(button).toBeDisabled()
  })

  it('예약하기 클릭 시 새 탭 링크(target=_blank)로 코트·날짜 페이지가 연결된다', () => {
    const availability: Record<string, DayAvailability> = {
      '2026-07-22': {
        date: '2026-07-22',
        kind: 'slot',
        slots: [{ start: '14:00', end: '16:00', available: true }],
      },
    }

    renderCard(
      <CourtCard
        court={court}
        distanceKm={1}
        dates={['2026-07-22']}
        availability={availability}
        weather={{}}
        now={new Date('2026-07-01T09:00:00')}
      />,
    )

    const link = screen.getByRole('link', { name: '예약하기' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('href', 'https://gytennis.or.kr/rsvDaily/1/2026-07-22')
  })

  it('코트 정보는 기본 닫힘이고 제공된 항목만 표시된다', () => {
    renderCard(
      <CourtCard
        court={court}
        distanceKm={1}
        dates={['2026-07-22']}
        availability={{}}
        weather={{}}
        now={new Date('2026-07-01T09:00:00')}
      />,
    )

    const details = screen.getByText('코트 정보').closest('details')
    expect(details).not.toHaveAttribute('open')
    expect(screen.getByText(/경기 고양시/)).toBeInTheDocument()
    expect(screen.queryByText(/☎/)).not.toBeInTheDocument()
  })

  it('칩 탭 시 정확한 강수확률·강수량이 툴팁으로 보인다', async () => {
    const availability: Record<string, DayAvailability> = {
      '2026-07-22': {
        date: '2026-07-22',
        kind: 'slot',
        slots: [{ start: '18:00', end: '20:00', available: true }],
      },
    }

    renderCard(
      <CourtCard
        court={court}
        distanceKm={1}
        dates={['2026-07-22']}
        availability={availability}
        weather={{ '2026-07-22': weatherHints }}
        now={new Date('2026-07-01T09:00:00')}
      />,
    )

    await userEvent.hover(screen.getByText(/18-20/))
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.textContent).toBe('강수 60% · 2mm')
  })
})
