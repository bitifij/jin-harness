import { mapWeatherTier } from '@/lib/weather/emoji'
import type { WeatherHint } from '@/types/tennis'

// KMA Lambert Conformal Conic 격자 변환 공식 (공공데이터포털 단기예보 API 문서 고정 상수)
const RE = 6371.00877
const GRID = 5.0
const SLAT1 = 30.0
const SLAT2 = 60.0
const OLON = 126.0
const OLAT = 38.0
const XO = 43
const YO = 136

export function latLngToGrid(lat: number, lng: number): { nx: number; ny: number } {
  const DEGRAD = Math.PI / 180.0
  const re = RE / GRID
  const slat1 = SLAT1 * DEGRAD
  const slat2 = SLAT2 * DEGRAD
  const olon = OLON * DEGRAD
  const olat = OLAT * DEGRAD

  const sn =
    Math.log(Math.cos(slat1) / Math.cos(slat2)) /
    Math.log(Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5))
  const sf = (Math.pow(Math.tan(Math.PI * 0.25 + slat1 * 0.5), sn) * Math.cos(slat1)) / sn
  const ro = (re * sf) / Math.pow(Math.tan(Math.PI * 0.25 + olat * 0.5), sn)

  const ra = (re * sf) / Math.pow(Math.tan(Math.PI * 0.25 + (lat * DEGRAD) * 0.5), sn)
  let theta = lng * DEGRAD - olon
  if (theta > Math.PI) theta -= 2.0 * Math.PI
  if (theta < -Math.PI) theta += 2.0 * Math.PI
  theta *= sn

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5)
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)
  return { nx, ny }
}

export interface KmaForecastItem {
  category: string
  fcstDate: string
  fcstTime: string
  fcstValue: string
}

function parsePcpValue(value: string): number {
  if (value.includes('없음')) return 0
  if (value.includes('미만')) return 0.5
  const range = value.match(/([\d.]+)\s*~\s*([\d.]+)/)
  if (range) return parseFloat(range[2])
  const numeric = parseFloat(value)
  return Number.isNaN(numeric) ? 0 : numeric
}

export function parseKmaForecastBlock(
  items: KmaForecastItem[],
  date: string,
  hourFrom: number,
  hourTo: number,
): WeatherHint {
  const ymd = date.replaceAll('-', '')
  const inBlock = items.filter((item) => {
    if (item.fcstDate !== ymd) return false
    const hour = parseInt(item.fcstTime.slice(0, 2), 10)
    return hour >= hourFrom && hour < hourTo
  })

  const pop = Math.max(
    0,
    ...inBlock.filter((i) => i.category === 'POP').map((i) => parseInt(i.fcstValue, 10)),
  )
  const precip = Math.max(
    0,
    ...inBlock.filter((i) => i.category === 'PCP').map((i) => parsePcpValue(i.fcstValue)),
  )

  return { hourFrom, hourTo, pop, precip, tier: mapWeatherTier(pop, precip) }
}
