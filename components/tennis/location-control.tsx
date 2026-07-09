import { Button } from '@/components/ui/button'
import type { GeoLocation } from '@/hooks/useGeolocation'

interface LocationControlProps {
  location: GeoLocation
  onRequestLocation: () => void
}

export function LocationControl({ location, onRequestLocation }: LocationControlProps) {
  if (location.source === 'gps') {
    return <div className="text-xs font-bold">현재 위치</div>
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">기본 위치(여의도) 사용 중</span>
      <Button size="sm" variant="outline" onClick={onRequestLocation}>
        현재 위치 사용하기
      </Button>
    </div>
  )
}
