'use client'

import { useEffect, useState } from 'react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useCourtFilters, courtMatchesTimeFilter } from '@/hooks/useCourtFilters'
import { LocationControl } from '@/components/tennis/location-control'
import { RadiusControl } from '@/components/tennis/radius-control'
import { DateSelector } from '@/components/tennis/date-selector'
import { TimeFilterButton } from '@/components/tennis/time-filter-button'
import { TimeFilterModal } from '@/components/tennis/time-filter-modal'
import { CourtList } from '@/components/tennis/court-list'
import { toYMD } from '@/lib/date'
import type { CourtWithAvailability } from '@/services/aggregate'

export function TennisRadar() {
  const { location, requestLocation } = useGeolocation()
  const { radius, setRadius, selectedHours, toggleHour, clearHours } = useCourtFilters()
  const [dates, setDates] = useState<string[]>(() => [toYMD(new Date())])
  const [timeModalOpen, setTimeModalOpen] = useState(false)
  const [courts, setCourts] = useState<CourtWithAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams({
      lat: String(location.lat),
      lng: String(location.lng),
      radius: String(radius),
      dates: dates.join(','),
    })
    let cancelled = false
    setLoading(true)
    setError(false)
    fetch(`/api/courts?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`요청 실패: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setCourts(data.courts ?? [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [location.lat, location.lng, radius, dates])

  const filteredCourts = courts.filter((court) => courtMatchesTimeFilter(court, dates, selectedHours))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <header>
        <h1 className="text-lg font-bold">테니스 레이더</h1>
      </header>
      <div className="flex flex-col gap-2 rounded-lg border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <LocationControl location={location} onRequestLocation={requestLocation} />
          <RadiusControl radius={radius} onRadiusChange={setRadius} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateSelector dates={dates} onDatesChange={setDates} />
          <TimeFilterButton selectedHours={selectedHours} onClick={() => setTimeModalOpen(true)} />
        </div>
      </div>
      {loading ? (
        <div className="p-6 text-center text-xs text-muted-foreground">불러오는 중...</div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-muted-foreground">코트 정보를 불러오지 못했습니다.</div>
      ) : (
        <CourtList courts={filteredCourts} dates={dates} />
      )}
      <TimeFilterModal
        open={timeModalOpen}
        onOpenChange={setTimeModalOpen}
        selectedHours={selectedHours}
        onToggleHour={toggleHour}
        onClear={clearHours}
      />
    </div>
  )
}
