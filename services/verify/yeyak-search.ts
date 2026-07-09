import type { Candidate, VerifyResult } from './judge'

export const YEYAK_SEARCH_URL = 'https://yeyak.seoul.go.kr/web/search/selectPageListSvcMoreAjax.do'

interface SearchRow {
  SVC_ID: string
  SVC_NM: string
  MUMM_CL_NM: string
}

// 검색 ajax 응답에서 테니스장 회차만 추출한다 (같은 시설명으로 농구장·촬영장소 등이 섞여 나옴)
export function extractTennisCandidates(searchResponseJson: string): Candidate[] {
  const parsed = JSON.parse(searchResponseJson) as { resultList?: SearchRow[] }
  return (parsed.resultList ?? [])
    .filter((row) => row.MUMM_CL_NM === '테니스장')
    .map((row) => ({ svcId: row.SVC_ID, name: row.SVC_NM }))
}

// 죽은 ID라도 사이트 검색에 동일 시설이 살아 있으면 "회차 로테이션"이다 —
// broken(수리 불가 신호)과 구분해 changed + 후보 목록으로 승격한다
export function judgeWithCandidates(result: VerifyResult, candidates: Candidate[]): VerifyResult {
  if (result.verdict !== 'broken' || candidates.length === 0) return result
  return { ...result, verdict: 'changed', candidates }
}
