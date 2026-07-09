import type { VerifyResult } from './judge'
import type { SkippedTarget } from './targets'

export interface RepairAction {
  courtId: string
  action: 'fixed' | 'hidden'
  detail: string  // 무엇을(old→new) 왜(근거) 어떻게(조사 방법) 바꿨는지
  timestamp: string
}

export interface ReportInput {
  ranAt: string
  results: VerifyResult[]
  skipped: SkippedTarget[]
  actions?: RepairAction[]
}

export interface Summary {
  total: number
  ok: number
  broken: number
  changed: number
}

export function summarize(results: VerifyResult[]): Summary {
  return {
    total: results.length,
    ok: results.filter((r) => r.verdict === 'ok').length,
    broken: results.filter((r) => r.verdict === 'broken').length,
    changed: results.filter((r) => r.verdict === 'changed').length,
  }
}

const VERDICT_EMOJI = { ok: '✅', broken: '❌', changed: '🔄' } as const

// 테이블 셀에 들어가는 자유 텍스트의 파이프가 md 테이블을 깨뜨리지 않도록 방어
const cell = (text: string) => text.replaceAll('|', '\\|')

export function renderReport({ ranAt, results, skipped, actions = [] }: ReportInput): string {
  const s = summarize(results)
  const lines: string[] = []

  lines.push('# 코트 링크 검증 리포트')
  lines.push('')
  lines.push(`- 실행 시각: ${ranAt}`)
  lines.push(
    s.broken + s.changed === 0
      ? `- 요약: **${s.total}개 점검, ${s.ok}개 정상**`
      : `- 요약: **${s.total}개 점검 — 정상 ${s.ok}, 깨짐 ${s.broken}, 변경 감지 ${s.changed}**`,
  )
  lines.push('')

  lines.push('## 점검 결과')
  lines.push('')
  lines.push('| 판정 | 항목 | 상세 |')
  lines.push('|---|---|---|')
  for (const r of results) {
    lines.push(`| ${VERDICT_EMOJI[r.verdict]} ${r.verdict} | ${cell(r.target.label)} | ${cell(r.reason)} |`)
  }
  lines.push('')

  const withCandidates = results.filter((r) => r.candidates?.length)
  if (withCandidates.length > 0) {
    lines.push('## 대체 후보 (변경 감지)')
    lines.push('')
    for (const r of withCandidates) {
      lines.push(`### ${r.target.label}`)
      for (const c of r.candidates!) {
        lines.push(`- \`${c.svcId}\` — ${c.name}`)
      }
      lines.push('')
    }
  }

  if (skipped.length > 0) {
    lines.push('## 점검 제외 (알려진 제약·숨김)')
    lines.push('')
    for (const sk of skipped) {
      lines.push(`- ${sk.label} (${sk.courtId}): ${sk.reason}`)
    }
    lines.push('')
  }

  lines.push('## 조치 내역')
  lines.push('')
  if (actions.length === 0) {
    lines.push('- 없음')
  } else {
    lines.push('| 시각 | 코트 | 액션 | 내용 |')
    lines.push('|---|---|---|---|')
    for (const a of actions) {
      lines.push(`| ${a.timestamp} | ${a.courtId} | ${a.action} | ${cell(a.detail)} |`)
    }
  }
  lines.push('')

  return lines.join('\n')
}
