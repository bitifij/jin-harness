import type { CourtInfo } from '@/types/tennis'

export function CourtInfoDetails({ info }: { info: CourtInfo }) {
  const rows: string[] = []
  if (info.address) rows.push(`📍 ${info.address}`)
  if (info.courtCount) rows.push(`🎾 ${info.courtCount}면${info.surface ? ` · ${info.surface}` : ''}`)
  if (info.hours) rows.push(`🕕 ${info.hours}`)
  if (info.fee) rows.push(`💰 ${info.fee}`)
  if (info.phone) rows.push(`☎ ${info.phone}`)

  if (rows.length === 0) return null

  return (
    <details className="mt-2">
      <summary className="flex cursor-pointer items-center gap-1 py-1 text-xs text-muted-foreground">
        코트 정보
      </summary>
      <div className="mt-2 space-y-1 pl-1 text-xs text-muted-foreground">
        {rows.map((row) => (
          <div key={row}>{row}</div>
        ))}
      </div>
    </details>
  )
}
