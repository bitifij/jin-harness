import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TimeChip } from '@/components/tennis/time-chip'
import { CourtInfoDetails } from '@/components/tennis/court-info'
import { toYMD, toHHmm } from '@/lib/date'
import type { Court, DayAvailability, Slot, WeatherHint } from '@/types/tennis'

interface CourtCardProps {
  court: Court
  distanceKm: number
  dates: string[]
  availability: Record<string, DayAvailability>
  weather: Record<string, WeatherHint[]>
  now?: Date
}

function findHint(hints: WeatherHint[] | undefined, slot: Slot): WeatherHint | undefined {
  if (!hints) return undefined
  const startHour = parseInt(slot.start.slice(0, 2), 10)
  const endHour = parseInt(slot.end.slice(0, 2), 10)
  return hints.find((h) => h.hourFrom <= startHour && h.hourTo >= endHour) ?? hints.find((h) => h.hourFrom <= startHour && h.hourTo > startHour)
}

function visibleSlots(avail: DayAvailability | undefined, date: string, now: Date): Slot[] {
  const slots = avail?.kind === 'slot' ? avail.slots ?? [] : []
  const available = slots.filter((s) => s.available)
  if (toYMD(now) !== date) return available
  const nowHHmm = toHHmm(now)
  return available.filter((s) => s.start >= nowHHmm)
}

export function CourtCard({ court, distanceKm, dates, availability, weather, now = new Date() }: CourtCardProps) {
  const dateRows = dates.map((date) => ({
    date,
    isToday: toYMD(now) === date,
    slots: visibleSlots(availability[date], date, now),
  }))
  const allClosed = dateRows.every((row) => row.slots.length === 0)
  const bookingDate = dateRows.find((row) => row.slots.length > 0)?.date ?? dates[0]
  const href = court.deepLinkTemplate.replace('{date}', bookingDate)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-bold">{court.name}</div>
            <div className="text-[11px] text-muted-foreground">{court.source}</div>
          </div>
          <div className="whitespace-nowrap text-xs">{distanceKm.toFixed(1)}km</div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {dateRows.map(({ date, isToday, slots }) => (
          <div key={date} className="border-t py-2 text-xs">
            <div className="mb-2 flex items-center gap-2">
              <span className="w-14 font-bold">
                {date.slice(5).replace('-', '/')}
                {isToday ? ' 오늘' : ''}
              </span>
              {slots.length > 0 ? (
                <Badge variant="secondary" className="ml-auto">
                  {slots.length}슬롯
                </Badge>
              ) : (
                <span className="ml-auto text-muted-foreground">
                  {isToday ? '오늘 예약가능 시간대 없음' : '마감'}
                </span>
              )}
            </div>
            {slots.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {slots.map((slot) => (
                  <TimeChip key={slot.start} slot={slot} weatherHint={findHint(weather[date], slot)} />
                ))}
              </div>
            )}
          </div>
        ))}
        <CourtInfoDetails info={court.info} />
      </CardContent>
      <CardFooter>
        {allClosed ? (
          <Button disabled className="w-full">
            예약마감
          </Button>
        ) : (
          <Button asChild className="w-full">
            <a href={href} target="_blank" rel="noreferrer">
              예약하기
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
