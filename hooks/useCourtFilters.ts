'use client'

import { useCallback, useState } from 'react'
import { DEFAULT_RADIUS_KM } from '@/config/courts'
import type { CourtWithAvailability } from '@/services/aggregate'
import type { Slot } from '@/types/tennis'

export function useCourtFilters() {
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM)
  const [selectedHours, setSelectedHours] = useState<number[]>([])

  const toggleHour = useCallback((hour: number) => {
    setSelectedHours((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort((a, b) => a - b),
    )
  }, [])

  const clearHours = useCallback(() => setSelectedHours([]), [])

  return { radius, setRadius, selectedHours, toggleHour, clearHours }
}

function slotOverlapsHours(slot: Slot, hours: number[]): boolean {
  const start = parseInt(slot.start.slice(0, 2), 10)
  const end = parseInt(slot.end.slice(0, 2), 10)
  return hours.some((h) => h >= start && h < end)
}

export function courtMatchesTimeFilter(
  court: CourtWithAvailability,
  dates: string[],
  selectedHours: number[],
): boolean {
  if (selectedHours.length === 0) return true
  if (court.source === 'yeyak') return true
  return dates.some((date) => {
    const avail = court.availability[date]
    if (avail?.kind !== 'slot') return false
    return (avail.slots ?? []).some((slot) => slot.available && slotOverlapsHours(slot, selectedHours))
  })
}
