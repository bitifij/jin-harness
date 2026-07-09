import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { judgeLink } from './judge'
import type { CheckTarget } from './judge'

const fixture = (name: string) => readFileSync(join(__dirname, '__fixtures__', name), 'utf-8')

const yeyakTarget: CheckTarget = {
  courtId: 'yeyak-jamwon',
  label: '잠원한강공원 테니스장 · 평일 딥링크',
  url: 'https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=S260628140735698089',
  expectedText: '잠원 한강공원 테니스장 1번 코트 평일',
}

describe('judgeLink — 하드 실패', () => {
  it('404 응답은 broken으로 판정하고 원인에 상태 코드를 담는다', () => {
    // 지난 사고: 양평누리 딥링크가 404
    const result = judgeLink(yeyakTarget, { status: 404, finalUrl: yeyakTarget.url, body: '<html>Not Found</html>' })
    expect(result.verdict).toBe('broken')
    expect(result.reason).toContain('404')
  })

  it('로그인 페이지로 리다이렉트되면 broken으로 판정하고 원인에 리다이렉트 대상을 담는다', () => {
    // 지난 사고: gytennis 딥링크가 로그인 페이지로 리다이렉트
    const result = judgeLink(
      { courtId: 'gytennis-1', label: '대화코트 · 딥링크', url: 'https://gytennis.or.kr/daily/1/2026-07-10' },
      { status: 200, finalUrl: 'https://gytennis.or.kr/login?returnUrl=%2Fdaily%2F1', body: '<html>로그인</html>' },
    )
    expect(result.verdict).toBe('broken')
    expect(result.reason).toContain('login')
  })
})

describe('judgeLink — 소프트 404 (yeyak)', () => {
  it('HTTP 200이어도 expectedText가 본문에 없으면 broken으로 판정한다', () => {
    // 지난 사고 실캡처: 가짜 rsv_svc_id → 200 + "페이지를 찾을 수 없습니다"
    const result = judgeLink(yeyakTarget, { status: 200, finalUrl: yeyakTarget.url, body: fixture('yeyak-soft404.html') })
    expect(result.verdict).toBe('broken')
    expect(result.reason).toContain('expectedText')
  })

  it('HTTP 200이고 expectedText가 본문에 있으면 ok로 판정한다', () => {
    const result = judgeLink(yeyakTarget, { status: 200, finalUrl: yeyakTarget.url, body: fixture('yeyak-valid.html') })
    expect(result.verdict).toBe('ok')
  })

  it('expectedText가 없는 타깃은 200이면 ok다 (gytennis·양평누리)', () => {
    const result = judgeLink(
      { courtId: 'yangpyeong-1', label: '양평누리 · 딥링크', url: 'https://srent.y-sisul.or.kr/page/rent/s04.od.list.asp' },
      { status: 200, finalUrl: 'https://srent.y-sisul.or.kr/page/rent/s04.od.list.asp', body: '<html>대관안내</html>' },
    )
    expect(result.verdict).toBe('ok')
  })
})
