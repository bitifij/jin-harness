export interface CheckTarget {
  courtId: string
  label: string
  url: string
  expectedText?: string
}

export interface FetchOutcome {
  status: number
  finalUrl: string
  body: string
}

export type Verdict = 'ok' | 'broken' | 'changed'

export interface Candidate {
  svcId: string
  name: string
}

export interface VerifyResult {
  target: CheckTarget
  verdict: Verdict
  reason: string
  candidates?: Candidate[]
}

export function judgeLink(target: CheckTarget, outcome: FetchOutcome): VerifyResult {
  if (outcome.status >= 400) {
    return { target, verdict: 'broken', reason: `HTTP ${outcome.status}` }
  }
  // 지난 사고: gytennis 딥링크가 존재하지 않는 경로 → 로그인 페이지로 리다이렉트되면서 200
  if (/login/i.test(outcome.finalUrl) && !/login/i.test(target.url)) {
    return { target, verdict: 'broken', reason: `로그인 페이지로 리다이렉트됨: ${outcome.finalUrl}` }
  }
  // 지난 사고: yeyak 가짜 rsv_svc_id → 200 + "페이지를 찾을 수 없습니다" (소프트 404)
  if (target.expectedText && !outcome.body.includes(target.expectedText)) {
    return { target, verdict: 'broken', reason: `expectedText "${target.expectedText}" 이(가) 본문에 없음 (소프트 404 의심)` }
  }
  return { target, verdict: 'ok', reason: `HTTP ${outcome.status}` }
}
