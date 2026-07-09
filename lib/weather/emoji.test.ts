import { describe, it, expect } from 'vitest'
import { mapWeatherTier, getWeatherEmoji } from './emoji'

describe('mapWeatherTier', () => {
  it('강수확률 0~20%는 clear다', () => {
    expect(mapWeatherTier(0, 0)).toBe('clear')
    expect(mapWeatherTier(20, 0)).toBe('clear')
  })

  it('강수확률 20~50%는 cloudy다', () => {
    expect(mapWeatherTier(21, 0)).toBe('cloudy')
    expect(mapWeatherTier(50, 0)).toBe('cloudy')
  })

  it('강수확률 50%+는 rain이다', () => {
    expect(mapWeatherTier(51, 1)).toBe('rain')
    expect(mapWeatherTier(100, 5)).toBe('rain')
  })

  it('강수량이 임계(10mm) 초과면 확률과 무관하게 heavy다', () => {
    expect(mapWeatherTier(10, 11)).toBe('heavy')
    expect(mapWeatherTier(90, 15)).toBe('heavy')
  })
})

describe('getWeatherEmoji', () => {
  it('tier별 이모지를 반환한다', () => {
    expect(getWeatherEmoji('clear')).toBe('☀️')
    expect(getWeatherEmoji('cloudy')).toBe('🌦️')
    expect(getWeatherEmoji('rain')).toBe('🌧️')
    expect(getWeatherEmoji('heavy')).toBe('⛈️')
  })
})
