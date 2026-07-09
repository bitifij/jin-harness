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

// weekend = 주말·공휴일 회차. 공휴일 판정은 하지 않으므로 데이터 조회 시
// 평일에 낀 공휴일은 weekday 링크로 매칭될 수 있다 (예약 링크는 카드에 둘 다 노출되므로 무관).
export type DayType = 'all' | 'weekday' | 'weekend'

export interface BookingLink {
  dayType: DayType
  urlTemplate: string  // {date} 플레이스홀더 허용
  expectedText?: string  // 링크 접속 결과 페이지에 반드시 있어야 하는 문자열 (소프트 404 판정)
}

export interface Court {
  id: string
  name: string
  source: CourtSource
  lat: number
  lng: number
  bookingLinks: BookingLink[]
  searchKeyword?: string  // 예약 ID 로테이션 시 대체 ID를 찾는 사이트 검색 키워드
  // 수리 불가 코트는 삭제하지 않고 숨긴다 (복구 가능해야 하므로 데이터 보존)
  hidden?: boolean
  hiddenReason?: string
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
