import { describe, it, expect } from 'vitest'
import { haversineKm } from './geo'

const YEOUIDO = { lat: 37.5219, lng: 126.9245 }

describe('haversineKm', () => {
  it('같은 좌표는 0km를 반환한다', () => {
    expect(haversineKm(37.5, 127.0, 37.5, 127.0)).toBe(0)
  })

  it('위도 1도 차이(경도 동일)는 약 111km다', () => {
    const d = haversineKm(37.0, 127.0, 38.0, 127.0)
    expect(d).toBeGreaterThan(110.5)
    expect(d).toBeLessThan(111.5)
  })

  it('여의도 트윈타워 → 양평누리(영등포) 거리는 약 2.4km다', () => {
    // 양평누리: 37.5244, 126.8973
    const d = haversineKm(YEOUIDO.lat, YEOUIDO.lng, 37.5244, 126.8973)
    expect(d).toBeGreaterThan(2.3)
    expect(d).toBeLessThan(2.5)
  })

  it('거리는 항상 양수다', () => {
    const d = haversineKm(37.0, 126.0, 38.0, 127.0)
    expect(d).toBeGreaterThan(0)
  })
})
