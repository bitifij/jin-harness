import { describe, it, expect } from 'vitest'
import { toYMD, getWeekdayDates, getWeekendDates } from './date'

describe('toYMD', () => {
  it('날짜를 YYYY-MM-DD 형식으로 반환한다', () => {
    expect(toYMD(new Date(2026, 6, 9))).toBe('2026-07-09')
  })

  it('월·일이 한 자리면 0으로 패딩한다', () => {
    expect(toYMD(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('getWeekdayDates', () => {
  // 2026-07-07(화) ~ 2026-07-13(월): 화·수·목·금·월이 평일
  const from = new Date(2026, 6, 7)
  const to = new Date(2026, 6, 13)

  it('주어진 기준일부터 조회범위 내 평일만 반환한다', () => {
    const result = getWeekdayDates(from, to)
    expect(result).toEqual([
      '2026-07-07',  // 화
      '2026-07-08',  // 수
      '2026-07-09',  // 목
      '2026-07-10',  // 금
      '2026-07-13',  // 월
    ])
  })

  it('주말(토·일)을 포함하지 않는다', () => {
    const result = getWeekdayDates(from, to)
    expect(result).not.toContain('2026-07-11')  // 토
    expect(result).not.toContain('2026-07-12')  // 일
  })
})

describe('getWeekendDates', () => {
  const from = new Date(2026, 6, 7)
  const to = new Date(2026, 6, 13)

  it('주말(토·일)만 반환한다', () => {
    const result = getWeekendDates(from, to)
    expect(result).toEqual(['2026-07-11', '2026-07-12'])
  })
})
