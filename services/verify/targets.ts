import { resolveBookingUrl } from '@/lib/booking'
import type { Court, DayType } from '@/types/tennis'
import type { CheckTarget } from './judge'

export interface SkippedTarget {
  courtId: string
  label: string
  reason: string
}

export interface TargetPlan {
  checks: CheckTarget[]
  skipped: SkippedTarget[]
}

const DAY_TYPE_LABEL: Record<DayType, string> = {
  all: '예약 링크',
  weekday: '평일 예약 링크',
  weekend: '주말·공휴일 예약 링크',
}

// 점검 항목은 courts config에서 자동 파생한다 — 수동 목록을 두면
// "검증 목록 ≠ 앱 노출 링크" 사각지대(지난 딥링크 사고의 근본 원인)가 재발한다.
export function buildTargets(courts: Court[], date: string): TargetPlan {
  const checks: CheckTarget[] = []
  const skipped: SkippedTarget[] = []
  let yeyakPresent = false

  for (const court of courts) {
    if (court.hidden) {
      skipped.push({
        courtId: court.id,
        label: `${court.name} · 전체`,
        reason: `숨김 상태 (${court.hiddenReason ?? '사유 미기록'})`,
      })
      continue
    }

    for (const link of court.bookingLinks) {
      checks.push({
        courtId: court.id,
        label: `${court.name} · ${DAY_TYPE_LABEL[link.dayType]}`,
        url: resolveBookingUrl(link, date),
        expectedText: link.expectedText,
      })
    }

    // 데이터 조회 경로 — 딥링크와 별개로 각각 점검한다 (지난 사고: 하나만 검증해 다른 쪽이 깨짐)
    if (court.source === 'yangpyeong') {
      const base = court.bookingLinks[0].urlTemplate
      checks.push({
        courtId: court.id,
        label: `${court.name} · 데이터 조회(sch_sym)`,
        url: `${base}?sch_sym=${date.slice(0, 7)}`,
        expectedText: undefined,
      })
    }
    // gytennis는 데이터 조회 URL이 예약 링크와 동일(/daily/{id}/{date})해 위 점검이 겸한다
    if (court.source === 'yeyak') yeyakPresent = true
  }

  if (yeyakPresent) {
    skipped.push({
      courtId: '(yeyak 공통)',
      label: 'yeyak 잔여 현황 캘린더 ajax',
      reason: 'WAF가 비브라우저 접근을 차단해 자동 점검 불가 — 알려진 제약 (learnings.md 참조)',
    })
  }

  return { checks, skipped }
}
