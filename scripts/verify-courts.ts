#!/usr/bin/env bun
// 코트 링크 검증 CLI — 등록된 모든 예약 링크·데이터 조회 경로를 실사이트로 점검한다.
// 사용법: bun run verify:courts [--actions <RepairAction[] JSON 파일>]
// exit 0 = 전 항목 정상, exit 1 = 깨짐/변경 감지 있음

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { courts } from '@/config/courts'
import { toYMD } from '@/lib/date'
import { curlGet, curlPost } from '@/lib/curl'
import { judgeLink, type VerifyResult } from '@/services/verify/judge'
import { buildTargets } from '@/services/verify/targets'
import { extractTennisCandidates, judgeWithCandidates, YEYAK_SEARCH_URL } from '@/services/verify/yeyak-search'
import { renderReport, summarize, type RepairAction } from '@/services/verify/report'

const REPORT_PATH = join(process.cwd(), 'artifacts/court-link-verify/report.md')
const MAX_SEARCH_PAGES = 10

async function searchCandidates(keyword: string) {
  const all = []
  for (let page = 1; page <= MAX_SEARCH_PAGES; page++) {
    const res = await curlPost(YEYAK_SEARCH_URL, { sch_text: keyword, currentPage: String(page) })
    if (res.status !== 200) break
    let pageRows
    try {
      pageRows = extractTennisCandidates(res.body)
    } catch {
      break
    }
    const parsed = JSON.parse(res.body) as { resultList?: unknown[] }
    all.push(...pageRows)
    if (!parsed.resultList || parsed.resultList.length === 0) break
  }
  return all
}

function readActions(): RepairAction[] {
  const flagIndex = process.argv.indexOf('--actions')
  if (flagIndex === -1) return []
  const path = process.argv[flagIndex + 1]
  if (!path || !existsSync(path)) {
    console.error(`--actions 파일을 찾을 수 없음: ${path}`)
    process.exit(2)
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as RepairAction[]
}

function nowKST(): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date()) + ' (KST)'
}

async function main() {
  const date = toYMD(new Date())
  const plan = buildTargets(courts, date)
  const results: VerifyResult[] = []

  console.log(`코트 링크 검증 — ${plan.checks.length}개 항목 (기준 날짜 ${date})\n`)

  for (const target of plan.checks) {
    let result: VerifyResult
    try {
      const outcome = await curlGet(target.url)
      result = judgeLink(target, outcome)
    } catch (err) {
      result = { target, verdict: 'broken', reason: `요청 실패: ${err instanceof Error ? err.message : String(err)}` }
    }

    // 깨진 yeyak 링크는 검색으로 대체 후보를 찾아 changed로 승격 시도 (회차 로테이션 감지)
    if (result.verdict === 'broken') {
      const court = courts.find((c) => c.id === target.courtId)
      if (court?.searchKeyword) {
        try {
          result = judgeWithCandidates(result, await searchCandidates(court.searchKeyword))
        } catch {
          // 검색 실패는 판정을 바꾸지 않는다 — broken 유지
        }
      }
    }

    const emoji = { ok: '✅', broken: '❌', changed: '🔄' }[result.verdict]
    console.log(`${emoji} ${result.target.label} — ${result.reason}`)
    results.push(result)
  }

  for (const sk of plan.skipped) {
    console.log(`⏭️  ${sk.label} — ${sk.reason}`)
  }

  const report = renderReport({ ranAt: nowKST(), results, skipped: plan.skipped, actions: readActions() })
  mkdirSync(dirname(REPORT_PATH), { recursive: true })
  writeFileSync(REPORT_PATH, report)

  const s = summarize(results)
  console.log(`\n요약: ${s.total}개 점검 — 정상 ${s.ok}, 깨짐 ${s.broken}, 변경 감지 ${s.changed}`)
  console.log(`리포트: ${REPORT_PATH}`)
  process.exit(s.broken + s.changed > 0 ? 1 : 0)
}

main()
