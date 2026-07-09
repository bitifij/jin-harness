export type CourtSource = 'gytennis' | 'yangpyeong' | 'yeyak'

export type WeatherTier = 'clear' | 'cloudy' | 'rain' | 'heavy'

export interface CourtInfo {
  address?: string
  courtCount?: number
  surface?: string
  fee?: string
  hours?: string
  phone?: string
}

export interface Court {
  id: string
  name: string
  source: CourtSource
  lat: number
  lng: number
  deepLinkTemplate: string
  slotUnitMinutes: number | Record<string, number>
  info: CourtInfo
}

export interface Slot {
  start: string  // HH:mm
  end: string    // HH:mm
  available: boolean
}

export type DayAvailabilityKind = 'slot' | 'count' | 'unavailable'

export interface DayAvailability {
  date: string  // YYYY-MM-DD
  kind: DayAvailabilityKind
  slots?: Slot[]
  remaining?: number
  capacity?: number
  loadError?: boolean
}

export interface WeatherHint {
  hourFrom: number
  hourTo: number
  tier: WeatherTier
  pop: number      // 강수확률 %
  precip: number   // 강수량 mm
}
