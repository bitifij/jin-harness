import { describe, it, expect } from 'vitest'
import { renderReport, summarize } from './report'
import type { VerifyResult } from './judge'
import type { SkippedTarget } from './targets'

const okResult: VerifyResult = {
  target: { courtId: 'gytennis-1', label: '대화코트 · 예약 링크', url: 'https://gytennis.or.kr/daily/1/2026-07-11' },
  verdict: 'ok',
  reason: 'HTTP 200',
}

const changedResult: VerifyResult = {
  target: {
    courtId: 'yeyak-hongeun',
    label: '홍은테니스장 · 평일 예약 링크',
    url: 'https://yeyak.seoul.go.kr/x?rsv_svc_id=DEAD',
    expectedText: '홍은테니스장 평일 주간',
  },
  verdict: 'changed',
  reason: 'expectedText "홍은테니스장 평일 주간" 이(가) 본문에 없음 (소프트 404 의심)',
  candidates: [{ svcId: 'S260709113110688728', name: '홍은테니스장 평일 주간 7월16일~31일' }],
}

const skipped: SkippedTarget[] = [
  { courtId: '(yeyak 공통)', label: 'yeyak 잔여 현황 캘린더 ajax', reason: 'WAF가 비브라우저 접근을 차단해 자동 점검 불가' },
]

describe('summarize', () => {
  it('판정별 개수를 집계한다', () => {
    const s = summarize([okResult, changedResult])
    expect(s).toEqual({ total: 2, ok: 1, broken: 0, changed: 1 })
  })
})

describe('renderReport', () => {
  it('전 항목 정상이면 "N개 점검, N개 정상" 요약과 실행 시각이 기록된다', () => {
    const md = renderReport({ ranAt: '2026-07-10 09:00 (KST)', results: [okResult], skipped: [] })
    expect(md).toContain('1개 점검, 1개 정상')
    expect(md).toContain('2026-07-10 09:00 (KST)')
  })

  it('changed 항목은 대체 후보(ID·이름)가 표시된다', () => {
    const md = renderReport({ ranAt: '2026-07-10 09:00 (KST)', results: [changedResult], skipped: [] })
    expect(md).toContain('S260709113110688728')
    expect(md).toContain('홍은테니스장 평일 주간 7월16일~31일')
  })

  it('skipped 항목은 알려진 제약으로 사유와 함께 표시된다', () => {
    const md = renderReport({ ranAt: '2026-07-10 09:00 (KST)', results: [okResult], skipped })
    expect(md).toContain('WAF')
  })

  it('RepairAction이 주어지면 조치 내역에 코트·액션·사유·시각이 나타난다', () => {
    const md = renderReport({
      ranAt: '2026-07-10 09:00 (KST)',
      results: [okResult],
      skipped: [],
      actions: [
        {
          courtId: 'yeyak-hongeun',
          action: 'fixed',
          detail: 'weekday rsv_svc_id S260623114555963304 → S260709113110688728 (7/16~31 회차 로테이션, 검색 ajax로 확인)',
          timestamp: '2026-07-16 09:05 (KST)',
        },
        {
          courtId: 'yeyak-gone',
          action: 'hidden',
          detail: '검색 결과에서 시설이 사라짐 — 대체 ID 없음',
          timestamp: '2026-07-16 09:06 (KST)',
        },
      ],
    })
    expect(md).toContain('조치 내역')
    expect(md).toContain('yeyak-hongeun')
    expect(md).toContain('S260709113110688728')
    expect(md).toContain('fixed')
    expect(md).toContain('hidden')
    expect(md).toContain('2026-07-16 09:06 (KST)')
  })

  it('조치가 없으면 조치 내역 섹션에 "없음"이 표시된다', () => {
    const md = renderReport({ ranAt: '2026-07-10 09:00 (KST)', results: [okResult], skipped: [] })
    expect(md).toContain('조치 내역')
    expect(md).toContain('없음')
  })
})
