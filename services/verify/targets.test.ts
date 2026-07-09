import { describe, it, expect } from 'vitest'
import { buildTargets } from './targets'
import type { Court } from '@/types/tennis'

const DATE = '2026-07-11'

function makeCourt(overrides: Partial<Court>): Court {
  return {
    id: 'c1',
    name: '코트',
    source: 'gytennis',
    lat: 37.5,
    lng: 127.0,
    bookingLinks: [{ dayType: 'all', urlTemplate: 'https://gytennis.or.kr/daily/1/{date}' }],
    slotUnitMinutes: 120,
    info: {},
    ...overrides,
  }
}

describe('buildTargets — 점검 항목은 courts config에서 자동 파생된다', () => {
  it('코트·링크를 추가하면 점검 항목이 자동으로 늘어난다', () => {
    const one = buildTargets([makeCourt({})], DATE)
    const two = buildTargets([makeCourt({}), makeCourt({ id: 'c2', name: '코트2' })], DATE)
    expect(two.checks.length).toBe(one.checks.length + 1)
  })

  it('요일유형별 링크가 2개인 코트는 점검 항목 2개로 확장된다', () => {
    const court = makeCourt({
      id: 'yeyak-1',
      source: 'yeyak',
      bookingLinks: [
        { dayType: 'weekday', urlTemplate: 'https://yeyak.seoul.go.kr/x?rsv_svc_id=WD', expectedText: '평일' },
        { dayType: 'weekend', urlTemplate: 'https://yeyak.seoul.go.kr/x?rsv_svc_id=WE', expectedText: '주말' },
      ],
    })
    const plan = buildTargets([court], DATE)
    const links = plan.checks.filter((c) => c.courtId === 'yeyak-1')
    expect(links).toHaveLength(2)
    expect(links.map((l) => l.url)).toEqual([
      'https://yeyak.seoul.go.kr/x?rsv_svc_id=WD',
      'https://yeyak.seoul.go.kr/x?rsv_svc_id=WE',
    ])
    expect(links[0].expectedText).toBe('평일')
  })

  it('{date} 플레이스홀더는 점검 날짜로 치환된다', () => {
    const plan = buildTargets([makeCourt({})], DATE)
    expect(plan.checks[0].url).toBe(`https://gytennis.or.kr/daily/1/${DATE}`)
  })

  it('hidden 코트는 점검 대상에서 빠지고 skipped에 사유와 함께 표기된다', () => {
    const plan = buildTargets([makeCourt({ hidden: true, hiddenReason: '시설 폐쇄' })], DATE)
    expect(plan.checks).toHaveLength(0)
    expect(plan.skipped.some((s) => s.courtId === 'c1' && s.reason.includes('시설 폐쇄'))).toBe(true)
  })

  it('양평누리는 데이터 조회 경로(sch_sym 파라미터)도 점검 항목에 포함된다', () => {
    const court = makeCourt({
      id: 'yangpyeong-1',
      source: 'yangpyeong',
      bookingLinks: [{ dayType: 'all', urlTemplate: 'https://srent.y-sisul.or.kr/page/rent/s04.od.list.asp' }],
    })
    const plan = buildTargets([court], DATE)
    expect(plan.checks.some((c) => c.url.includes('sch_sym=2026-07'))).toBe(true)
  })

  it('yeyak 캘린더 ajax는 WAF 차단으로 자동 점검 불가 — skipped에 알려진 제약으로 표기된다', () => {
    const court = makeCourt({
      id: 'yeyak-1',
      source: 'yeyak',
      bookingLinks: [{ dayType: 'weekday', urlTemplate: 'https://yeyak.seoul.go.kr/x?rsv_svc_id=WD', expectedText: '평일' }],
    })
    const plan = buildTargets([court], DATE)
    expect(plan.skipped.some((s) => s.reason.includes('WAF'))).toBe(true)
  })
})
