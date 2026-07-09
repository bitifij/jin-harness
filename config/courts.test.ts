import { describe, it, expect } from 'vitest'
import { courts } from './courts'

describe('courts config', () => {
  it('모든 코트가 필수 필드를 가진다', () => {
    for (const court of courts) {
      expect(court.id, `${court.name}: id 누락`).toBeTruthy()
      expect(court.source, `${court.name}: source 누락`).toBeTruthy()
      expect(court.lat, `${court.name}: lat 누락`).toBeTruthy()
      expect(court.lng, `${court.name}: lng 누락`).toBeTruthy()
      expect(court.deepLinkTemplate, `${court.name}: deepLinkTemplate 누락`).toBeTruthy()
    }
  })

  it('gytennis 코트가 10개다', () => {
    const gytennis = courts.filter(c => c.source === 'gytennis')
    expect(gytennis).toHaveLength(10)
  })

  it('양평누리 코트가 1개다', () => {
    const yangpyeong = courts.filter(c => c.source === 'yangpyeong')
    expect(yangpyeong).toHaveLength(1)
  })

  it('yeyak 코트가 1개 이상 있다', () => {
    const yeyak = courts.filter(c => c.source === 'yeyak')
    expect(yeyak.length).toBeGreaterThanOrEqual(1)
  })

  it('모든 id가 유일하다', () => {
    const ids = courts.map(c => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('소스 값이 유효하다', () => {
    const validSources = ['gytennis', 'yangpyeong', 'yeyak']
    for (const court of courts) {
      expect(validSources).toContain(court.source)
    }
  })
})
