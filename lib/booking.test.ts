import { describe, it, expect } from 'vitest'
import { pickBookingLink, resolveBookingUrl } from './booking'
import type { BookingLink } from '@/types/tennis'

const weekday: BookingLink = { dayType: 'weekday', urlTemplate: 'https://example.com/?rsv_svc_id=WEEKDAY' }
const weekend: BookingLink = { dayType: 'weekend', urlTemplate: 'https://example.com/?rsv_svc_id=WEEKEND' }
const all: BookingLink = { dayType: 'all', urlTemplate: 'https://example.com/daily/1/{date}' }

describe('pickBookingLink', () => {
  it('평일 날짜에는 weekday 링크를 고른다', () => {
    // 2026-07-08은 수요일
    expect(pickBookingLink([weekday, weekend], '2026-07-08')).toBe(weekday)
  })

  it('주말 날짜에는 weekend 링크를 고른다', () => {
    // 2026-07-11은 토요일
    expect(pickBookingLink([weekday, weekend], '2026-07-11')).toBe(weekend)
  })

  it("dayType 'all' 링크는 요일과 무관하게 선택된다", () => {
    expect(pickBookingLink([all], '2026-07-08')).toBe(all)
    expect(pickBookingLink([all], '2026-07-11')).toBe(all)
  })

  it('요일유형에 맞는 링크가 없으면 첫 링크로 폴백한다', () => {
    // weekend 링크만 있는 코트를 평일에 조회하는 경우 — 링크가 아예 없는 것보다 낫다
    expect(pickBookingLink([weekend], '2026-07-08')).toBe(weekend)
  })
})

describe('resolveBookingUrl', () => {
  it('{date} 플레이스홀더를 날짜로 치환한다', () => {
    expect(resolveBookingUrl(all, '2026-07-08')).toBe('https://example.com/daily/1/2026-07-08')
  })

  it('플레이스홀더가 없으면 그대로 반환한다', () => {
    expect(resolveBookingUrl(weekend, '2026-07-11')).toBe('https://example.com/?rsv_svc_id=WEEKEND')
  })
})
