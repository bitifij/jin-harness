import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parseYangpyeongPage } from './yangpyeong'

const fixture = readFileSync(
  resolve(__dirname, '__fixtures__/yangpyeong-daily.html'),
  'utf-8',
)

describe('parseYangpyeongPage', () => {
  describe('2026-07-13 (예약가능 날짜)', () => {
    const DATE = '2026-07-13'

    it('kind가 slot이다', () => {
      const result = parseYangpyeongPage(fixture, DATE)
      expect(result.kind).toBe('slot')
      expect(result.date).toBe(DATE)
    })

    it('2h 예약단위 — 8슬롯을 반환한다', () => {
      const result = parseYangpyeongPage(fixture, DATE)
      expect(result.slots).toHaveLength(8)
      expect(result.slots![0]).toMatchObject({ start: '06:00', end: '08:00' })
      expect(result.slots![7]).toMatchObject({ start: '20:00', end: '22:00' })
    })

    it('status_y 슬롯은 available=true, status_e·status_r는 false다', () => {
      const result = parseYangpyeongPage(fixture, DATE)
      const availableSlots = result.slots!.filter(s => s.available)
      // 06~18: 6슬롯 예약가능, 18~22: 2슬롯 예약완료
      expect(availableSlots).toHaveLength(6)
      expect(availableSlots[0]).toMatchObject({ start: '06:00', available: true })
    })

    it('예약완료 슬롯은 available=false다', () => {
      const result = parseYangpyeongPage(fixture, DATE)
      const slot1820 = result.slots!.find(s => s.start === '18:00')
      expect(slot1820?.available).toBe(false)
    })
  })

  describe('2026-07-09 (당일 — 일부 기간종료)', () => {
    const DATE = '2026-07-09'

    it('기간종료 슬롯은 available=false다', () => {
      const result = parseYangpyeongPage(fixture, DATE)
      expect(result.kind).toBe('slot')
      // 06-16은 기간종료, 16-18은 예약가능(fetch 시각 15:30 기준), 18-22는 예약완료
      const slot0600 = result.slots!.find(s => s.start === '06:00')
      expect(slot0600?.available).toBe(false)
    })

    it('아직 지나지 않은 16:00 슬롯은 예약가능이다 (fixture 기준)', () => {
      const result = parseYangpyeongPage(fixture, DATE)
      const slot1600 = result.slots!.find(s => s.start === '16:00')
      expect(slot1600?.available).toBe(true)
    })
  })

  it('존재하지 않는 날짜는 loadError=true를 반환한다', () => {
    const result = parseYangpyeongPage(fixture, '2026-08-99')
    expect(result.loadError).toBe(true)
    expect(result.kind).toBe('unavailable')
  })

  it('HTML 구조 불일치 시 loadError=true를 반환한다', () => {
    const result = parseYangpyeongPage('<html><body></body></html>', '2026-07-13')
    expect(result.loadError).toBe(true)
  })
})
