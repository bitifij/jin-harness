import type { WeatherTier } from '@/types/tennis'

// 기상청 강수강도 기준(10mm/h 이상 "강한 비")을 heavy 임계로 사용
const HEAVY_PRECIP_MM = 10

const EMOJI: Record<WeatherTier, string> = {
  clear: '☀️',
  cloudy: '🌦️',
  rain: '🌧️',
  heavy: '⛈️',
}

export function mapWeatherTier(pop: number, precip: number): WeatherTier {
  if (precip > HEAVY_PRECIP_MM) return 'heavy'
  if (pop <= 20) return 'clear'
  if (pop <= 50) return 'cloudy'
  return 'rain'
}

export function getWeatherEmoji(tier: WeatherTier): string {
  return EMOJI[tier]
}
