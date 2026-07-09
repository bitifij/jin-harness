import { Button } from '@/components/ui/button'

interface TimeFilterButtonProps {
  selectedHours: number[]
  onClick: () => void
}

function formatRanges(hours: number[]): string {
  if (hours.length === 0) return '전체'
  const sorted = [...hours].sort((a, b) => a - b)
  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]
  for (let i = 1; i < sorted.length; i++) {
    const h = sorted[i]
    if (h !== prev + 1) {
      ranges.push(`${start}-${prev + 1}`)
      start = h
    }
    prev = h
  }
  ranges.push(`${start}-${prev + 1}`)
  return ranges.join(', ')
}

export function TimeFilterButton({ selectedHours, onClick }: TimeFilterButtonProps) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      시간 {formatRanges(selectedHours)}
    </Button>
  )
}
