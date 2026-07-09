'use client'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toYMD, getWeekdayDates, getWeekendDates, addDays } from '@/lib/date'

interface DateSelectorProps {
  dates: string[]
  onDatesChange: (dates: string[]) => void
  rangeDays?: number
  now?: Date
}

export function DateSelector({ dates, onDatesChange, rangeDays = 14, now = new Date() }: DateSelectorProps) {
  const selectedDates = dates.map((d) => new Date(`${d}T00:00:00`))

  const handleSelect = (selected: Date[] | undefined) => {
    onDatesChange((selected ?? []).map(toYMD))
  }

  const applyWeekday = () => onDatesChange(getWeekdayDates(now, addDays(now, rangeDays - 1)))
  const applyWeekend = () => onDatesChange(getWeekendDates(now, addDays(now, rangeDays - 1)))
  const removeDate = (date: string) => onDatesChange(dates.filter((d) => d !== date))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={applyWeekday}>
        평일
      </Button>
      <Button size="sm" variant="outline" onClick={applyWeekend}>
        주말
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline">
            날짜 선택
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar mode="multiple" selected={selectedDates} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
      {dates.map((date) => (
        <Badge key={date} variant="secondary" className="gap-1">
          {date.slice(5).replace('-', '/')}
          <button type="button" aria-label={`${date} 선택 해제`} onClick={() => removeDate(date)}>
            ✕
          </button>
        </Badge>
      ))}
    </div>
  )
}
