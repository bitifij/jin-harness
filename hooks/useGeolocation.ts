'use client'

import { useCallback, useEffect, useState } from 'react'
import { YEOUIDO_FALLBACK } from '@/config/courts'

export type LocationSource = 'gps' | 'fallback'

export interface GeoLocation {
  lat: number
  lng: number
  source: LocationSource
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation>({ ...YEOUIDO_FALLBACK, source: 'fallback' })

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'gps' }),
      () => setLocation({ ...YEOUIDO_FALLBACK, source: 'fallback' }),
    )
  }, [])

  useEffect(() => {
    requestLocation()
  }, [requestLocation])

  return { location, requestLocation }
}
