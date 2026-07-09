import { latLngToGrid, parseKmaForecastBlock } from '@/services/weather/kma'
import type { WeatherHint } from '@/types/tennis'

export interface WeatherProvider {
  getHint(lat: number, lng: number, date: string, hourFrom: number, hourTo: number): Promise<WeatherHint>
}

// NOTE: 실제 엔드포인트·응답 스키마는 공공데이터포털 발급키로 실호출 검증 필요 (미검증)
const FORECAST_URL = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'

export const kmaWeatherProvider: WeatherProvider = {
  async getHint(lat, lng, date, hourFrom, hourTo) {
    const { nx, ny } = latLngToGrid(lat, lng)
    const baseDate = date.replaceAll('-', '')
    const params = new URLSearchParams({
      serviceKey: process.env.WEATHER_API_KEY ?? '',
      dataType: 'JSON',
      base_date: baseDate,
      base_time: '0500',
      nx: String(nx),
      ny: String(ny),
      numOfRows: '1000',
    })

    try {
      const res = await fetch(`${FORECAST_URL}?${params.toString()}`, { next: { revalidate: 1800 } })
      if (!res.ok) return { hourFrom, hourTo, tier: 'clear', pop: 0, precip: 0 }
      const json = await res.json()
      const items = json?.response?.body?.items?.item ?? []
      return parseKmaForecastBlock(items, date, hourFrom, hourTo)
    } catch {
      return { hourFrom, hourTo, tier: 'clear', pop: 0, precip: 0 }
    }
  },
}
