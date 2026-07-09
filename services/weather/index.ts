import { latLngToGrid, parseKmaForecastBlock, type KmaForecastItem } from '@/services/weather/kma'
import type { WeatherHint } from '@/types/tennis'

export interface WeatherProvider {
  getHint(lat: number, lng: number, date: string, hourFrom: number, hourTo: number): Promise<WeatherHint>
}

// NOTE: 실제 엔드포인트·응답 스키마는 공공데이터포털 발급키로 실호출 검증 필요 (미검증)
const FORECAST_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'
const CACHE_TTL_MS = 1800_000

// aggregateCourts가 코트당 8개 시간블록을 동시에 조회하므로(같은 nx/ny/base_date),
// 요청별 fetch를 그대로 두면 동일 예보를 8배로 중복 호출하게 된다 — nx/ny/날짜 단위로 응답을 공유한다.
const forecastCache = new Map<string, { expiresAt: number; items: Promise<KmaForecastItem[]> }>()

function fetchForecastItems(nx: number, ny: number, baseDate: string): Promise<KmaForecastItem[]> {
  const key = `${nx},${ny},${baseDate}`
  const cached = forecastCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.items

  const params = new URLSearchParams({
    serviceKey: process.env.WEATHER_API_KEY ?? '',
    dataType: 'JSON',
    base_date: baseDate,
    base_time: '0500',
    nx: String(nx),
    ny: String(ny),
    numOfRows: '1000',
  })

  const items = fetch(`${FORECAST_URL}?${params.toString()}`, { next: { revalidate: 1800 } })
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => json?.response?.body?.items?.item ?? [])
    .catch(() => [])

  forecastCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, items })
  return items
}

export const kmaWeatherProvider: WeatherProvider = {
  async getHint(lat, lng, date, hourFrom, hourTo) {
    const { nx, ny } = latLngToGrid(lat, lng)
    const baseDate = date.replaceAll('-', '')
    const items = await fetchForecastItems(nx, ny, baseDate)
    return parseKmaForecastBlock(items, date, hourFrom, hourTo)
  },
}
