'use client'

import { useState } from 'react'
import { DEFAULT_RADIUS_KM } from '@/config/courts'

export function useCourtFilters() {
  const [radius, setRadius] = useState(DEFAULT_RADIUS_KM)
  return { radius, setRadius }
}
