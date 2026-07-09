import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCourtFilters, courtMatchesTimeFilter } from './useCourtFilters'
import { DEFAULT_RADIUS_KM } from '@/config/courts'
import type { CourtWithAvailability } from '@/services/aggregate'

describe('useCourtFilters', () => {
  it('기본 반경은 DEFAULT_RADIUS_KM이다', () => {
    const { result } = renderHook(() => useCourtFilters())
    expect(result.current.radius).toBe(DEFAULT_RADIUS_KM)
  })

  it('setRadius로 반경을 변경할 수 있다', () => {
    const { result } = renderHook(() => useCourtFilters())
    act(() => result.current.setRadius(5))
    expect(result.current.radius).toBe(5)
  })

  it('toggleHour로 시간을 추가·제거할 수 있다 (불연속 다중 선택)', () => {
    const { result } = renderHook(() => useCourtFilters())
    act(() => {
      result.current.toggleHour(12)
      result.current.toggleHour(13)
      result.current.toggleHour(18)
    })
    expect(result.current.selectedHours).toEqual([12, 13, 18])

    act(() => result.current.toggleHour(13))
    expect(result.current.selectedHours).toEqual([12, 18])
  })

  it('clearHours로 전체 해제된다', () => {
    const { result } = renderHook(() => useCourtFilters())
    act(() => result.current.toggleHour(12))
    act(() => result.current.clearHours())
    expect(result.current.selectedHours).toEqual([])
  })
})

const DATE = '2026-07-22'

function slotCourt(slots: { start: string; end: string; available: boolean }[]): CourtWithAvailability {
  return {
    id: 'gytennis-1',
    name: '대화코트',
    source: 'gytennis',
    lat: 0,
    lng: 0,
    deepLinkTemplate: '',
    slotUnitMinutes: 120,
    info: {},
    distanceKm: 1,
    availability: { [DATE]: { date: DATE, kind: 'slot', slots } },
    weather: {},
  }
}

describe('courtMatchesTimeFilter', () => {
  it('선택 없으면 모든 코트가 통과한다', () => {
    const court = slotCourt([{ start: '14:00', end: '16:00', available: true }])
    expect(courtMatchesTimeFilter(court, [DATE], [])).toBe(true)
  })

  it('선택 구간(18-22)과 겹치는 가능 슬롯이 없으면 제외된다', () => {
    const court = slotCourt([{ start: '14:00', end: '16:00', available: true }])
    expect(courtMatchesTimeFilter(court, [DATE], [18, 19, 20, 21])).toBe(false)
  })

  it('1시간 슬롯이든 2시간 슬롯이든 구간과 겹치면 통과한다', () => {
    const oneHour = slotCourt([{ start: '18:00', end: '19:00', available: true }])
    const twoHour = slotCourt([{ start: '18:00', end: '20:00', available: true }])
    expect(courtMatchesTimeFilter(oneHour, [DATE], [18])).toBe(true)
    expect(courtMatchesTimeFilter(twoHour, [DATE], [18, 19])).toBe(true)
  })

  it('불연속 구간(12-14, 18-22) 중 하나와 겹치면 통과한다', () => {
    const court = slotCourt([{ start: '20:00', end: '22:00', available: true }])
    expect(courtMatchesTimeFilter(court, [DATE], [12, 13, 18, 19, 20, 21])).toBe(true)
  })

  it('yeyak 코트는 항상 통과한다 (시간 미상)', () => {
    const court = { ...slotCourt([]), source: 'yeyak' as const }
    expect(courtMatchesTimeFilter(court, [DATE], [18, 19])).toBe(true)
  })
})
