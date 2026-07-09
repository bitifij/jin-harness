import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parseGytennisDaily } from './gytennis'

const fixture = readFileSync(
  resolve(__dirname, '__fixtures__/gytennis-daily.html'),
  'utf-8',
)

const DATE = '2026-07-09'

describe('parseGytennisDaily', () => {
  it('kind가 slot이다', () => {
    const result = parseGytennisDaily(fixture, DATE)
    expect(result.kind).toBe('slot')
    expect(result.date).toBe(DATE)
  })

  it('2h 예약단위 — 06:00~22:00 구간 8슬롯을 반환한다', () => {
    const result = parseGytennisDaily(fixture, DATE)
    expect(result.slots).toHaveLength(8)
    expect(result.slots![0]).toMatchObject({ start: '06:00', end: '08:00' })
    expect(result.slots![7]).toMatchObject({ start: '20:00', end: '22:00' })
  })

  it('fixture에서 4개 슬롯이 예약가능하다 (08-10, 12-14, 14-16, 16-18)', () => {
    const result = parseGytennisDaily(fixture, DATE)
    const available = result.slots!.filter(s => s.available)
    expect(available).toHaveLength(4)
    expect(available.map(s => s.start)).toEqual(['08:00', '12:00', '14:00', '16:00'])
  })

  it('한 시간대에 ≥1면 available이면 해당 슬롯이 available로 집계된다', () => {
    // 08:00-10:00은 3면 코트에서만 available → 집계 결과 available
    const result = parseGytennisDaily(fixture, DATE)
    const slot0800 = result.slots!.find(s => s.start === '08:00')
    expect(slot0800?.available).toBe(true)
  })

  it('전체 예약된 시간대는 available=false다', () => {
    const result = parseGytennisDaily(fixture, DATE)
    const slot0600 = result.slots!.find(s => s.start === '06:00')
    expect(slot0600?.available).toBe(false)
  })

  it('HTML 구조 불일치 시 loadError=true를 반환한다', () => {
    const result = parseGytennisDaily('<html><body>error</body></html>', DATE)
    expect(result.loadError).toBe(true)
    expect(result.kind).toBe('unavailable')
  })
})
