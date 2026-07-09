import { CourtCard } from '@/components/tennis/court-card'
import type { CourtWithAvailability } from '@/services/aggregate'

interface CourtListProps {
  courts: CourtWithAvailability[]
  dates: string[]
}

export function CourtList({ courts, dates }: CourtListProps) {
  if (courts.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        <div>반경 내 코트가 없습니다.</div>
        <div>반경을 늘려보세요.</div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
      {courts.map((court) => (
        <CourtCard
          key={court.id}
          court={court}
          distanceKm={court.distanceKm}
          dates={dates}
          availability={court.availability}
          weather={court.weather}
        />
      ))}
    </div>
  )
}
