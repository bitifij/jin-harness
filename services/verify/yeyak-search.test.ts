import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { extractTennisCandidates, judgeWithCandidates } from './yeyak-search'
import type { CheckTarget, VerifyResult } from './judge'

const searchJson = readFileSync(join(__dirname, '__fixtures__', 'yeyak-search.json'), 'utf-8')

const target: CheckTarget = {
  courtId: 'yeyak-hongeun',
  label: '홍은테니스장 · 평일 딥링크',
  url: 'https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=DEAD_ID',
  expectedText: '홍은테니스장 평일 주간',
}

describe('extractTennisCandidates', () => {
  it('검색 응답에서 테니스장 회차만 SVC_ID·이름으로 추출한다', () => {
    const candidates = extractTennisCandidates(searchJson)
    expect(candidates.length).toBe(4)
    expect(candidates[0]).toHaveProperty('svcId')
    expect(candidates[0].name).toContain('홍은테니스장')
  })

  it('테니스장이 아닌 회차(농구장 등)는 제외한다', () => {
    const withNoise = JSON.stringify({
      resultList: [
        { SVC_ID: 'S1', SVC_NM: '농구장4-잠원한강공원', MUMM_CL_NM: '농구장' },
        { SVC_ID: 'S2', SVC_NM: '잠원 한강공원 테니스장 1번 코트 평일', MUMM_CL_NM: '테니스장' },
      ],
    })
    const candidates = extractTennisCandidates(withNoise)
    expect(candidates).toEqual([{ svcId: 'S2', name: '잠원 한강공원 테니스장 1번 코트 평일' }])
  })
})

describe('judgeWithCandidates', () => {
  const brokenResult: VerifyResult = {
    target,
    verdict: 'broken',
    reason: 'expectedText "홍은테니스장 평일 주간" 이(가) 본문에 없음 (소프트 404 의심)',
  }

  it('broken인데 검색에서 동일 시설 후보가 있으면 changed로 승격하고 후보를 담는다', () => {
    const result = judgeWithCandidates(brokenResult, extractTennisCandidates(searchJson))
    expect(result.verdict).toBe('changed')
    expect(result.candidates?.length).toBeGreaterThan(0)
    expect(result.candidates![0].name).toContain('홍은테니스장')
  })

  it('broken이고 후보가 없으면 broken을 유지한다 (수리 불가 신호)', () => {
    const result = judgeWithCandidates(brokenResult, [])
    expect(result.verdict).toBe('broken')
    expect(result.candidates).toBeUndefined()
  })

  it('ok 판정은 후보와 무관하게 그대로 유지한다', () => {
    const okResult: VerifyResult = { target, verdict: 'ok', reason: 'HTTP 200' }
    const result = judgeWithCandidates(okResult, extractTennisCandidates(searchJson))
    expect(result.verdict).toBe('ok')
  })
})
