import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { latLngToGrid, parseKmaForecastBlock } from './kma'

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, '__fixtures__/kma-forecast.json'), 'utf-8'),
)
const items = fixture.response.body.items.item

describe('latLngToGrid', () => {
  it('서울시청 좌표를 알려진 격자(nx=60, ny=127)로 변환한다', () => {
    expect(latLngToGrid(37.5714, 126.9769)).toEqual({ nx: 60, ny: 127 })
  })
})

describe('parseKmaForecastBlock', () => {
  it('블록 내 최고 강수확률·강수량으로 WeatherHint를 구성한다 (14~16시)', () => {
    const hint = parseKmaForecastBlock(items, '2026-07-09', 14, 16)
    expect(hint.hourFrom).toBe(14)
    expect(hint.hourTo).toBe(16)
    expect(hint.pop).toBe(60)
    expect(hint.precip).toBe(0.5)
    expect(hint.tier).toBe('rain')
  })

  it('강수량 구간 표기("30.0~50.0mm")는 상한값으로 파싱하고 tier=heavy가 된다 (16~18시)', () => {
    const hint = parseKmaForecastBlock(items, '2026-07-09', 16, 18)
    expect(hint.precip).toBe(50)
    expect(hint.tier).toBe('heavy')
  })

  it('강수없음 구간은 precip=0, pop 기준으로 tier가 정해진다 (18~20시)', () => {
    const hint = parseKmaForecastBlock(items, '2026-07-09', 18, 20)
    expect(hint.pop).toBe(10)
    expect(hint.precip).toBe(0)
    expect(hint.tier).toBe('clear')
  })

  it('해당 블록에 데이터가 없으면 pop=0, precip=0, tier=clear를 반환한다', () => {
    const hint = parseKmaForecastBlock(items, '2026-07-10', 6, 8)
    expect(hint).toMatchObject({ hourFrom: 6, hourTo: 8, pop: 0, precip: 0, tier: 'clear' })
  })
})
