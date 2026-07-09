import { courts } from '@/config/courts'
import { fetchGytennisDaily } from '@/services/sources/gytennis'
import { fetchYangpyeongDaily } from '@/services/sources/yangpyeong'
import { fetchYeyakCalendar } from '@/services/sources/yeyak'
import { kmaWeatherProvider } from '@/services/weather'
import { haversineKm } from '@/lib/geo'
import type { Court, DayAvailability, WeatherHint } from '@/types/tennis'

export interface CourtWithAvailability extends Court {
  distanceKm: number
  availability: Record<string, DayAvailability>
  weather: Record<string, WeatherHint[]>
}

// 코트 대표 운영시간(06~22시)을 2h 블록으로 나눠 날씨 조회 — gytennis/양평누리 슬롯 단위(2h)와 정렬
const OPERATING_HOURS: [number, number] = [6, 22]
const WEATHER_BLOCK_HOURS = 2

function buildWeatherBlocks(): Array<[number, number]> {
  const blocks: Array<[number, number]> = []
  for (let h = OPERATING_HOURS[0]; h < OPERATING_HOURS[1]; h += WEATHER_BLOCK_HOURS) {
    blocks.push([h, h + WEATHER_BLOCK_HOURS])
  }
  return blocks
}

function extractGytennisCourtId(court: Court): string {
  const match = court.deepLinkTemplate.match(/\/daily\/(\d+)\//)
  return match ? match[1] : court.id
}

function extractYeyakSvcId(court: Court): string {
  return new URL(court.deepLinkTemplate).searchParams.get('rsv_svc_id') ?? court.id
}

function fetchAvailability(court: Court, date: string): Promise<DayAvailability> {
  switch (court.source) {
    case 'gytennis':
      return fetchGytennisDaily(extractGytennisCourtId(court), date)
    case 'yangpyeong':
      return fetchYangpyeongDaily(date)
    case 'yeyak':
      return fetchYeyakCalendar(extractYeyakSvcId(court), date)
  }
}

async function fetchWeatherForDate(court: Court, date: string): Promise<WeatherHint[]> {
  return Promise.all(
    buildWeatherBlocks().map(([from, to]) => kmaWeatherProvider.getHint(court.lat, court.lng, date, from, to)),
  )
}

export async function aggregateCourts(
  lat: number,
  lng: number,
  radiusKm: number,
  dates: string[],
): Promise<CourtWithAvailability[]> {
  const withinRadius = courts
    .map((court) => ({ court, distanceKm: haversineKm(lat, lng, court.lat, court.lng) }))
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)

  return Promise.all(
    withinRadius.map(async ({ court, distanceKm }) => {
      const availability: Record<string, DayAvailability> = {}
      const weather: Record<string, WeatherHint[]> = {}

      await Promise.all(
        dates.map(async (date) => {
          const [dayAvailability, weatherHints] = await Promise.all([
            fetchAvailability(court, date),
            fetchWeatherForDate(court, date),
          ])
          availability[date] = dayAvailability
          weather[date] = weatherHints
        }),
      )

      return { ...court, distanceKm, availability, weather }
    }),
  )
}
