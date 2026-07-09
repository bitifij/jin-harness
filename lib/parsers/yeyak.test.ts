import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parseYeyakCalendar } from './yeyak'

const fixture = readFileSync(
  resolve(__dirname, '__fixtures__/yeyak-cal.json'),
  'utf-8',
)

describe('parseYeyakCalendar', () => {
  it('예약가능 날짜는 kind=count, remaining/capacity를 반환한다', () => {
    const result = parseYeyakCalendar(fixture, '2026-07-09')
    expect(result).toMatchObject({
      date: '2026-07-09',
      kind: 'count',
      remaining: 3,
      capacity: 10,
    })
  })

  it('remaining=0(마감)이어도 kind=count로 판별 가능한 값을 반환한다', () => {
    const result = parseYeyakCalendar(fixture, '2026-07-12')
    expect(result).toMatchObject({
      date: '2026-07-12',
      kind: 'count',
      remaining: 0,
      capacity: 10,
    })
  })

  it('해당 날짜에 운영 정보가 없으면(휴무) kind=unavailable, loadError는 없다', () => {
    const result = parseYeyakCalendar(fixture, '2026-07-10')
    expect(result.kind).toBe('unavailable')
    expect(result.loadError).toBeFalsy()
  })

  it('JSON 파싱 실패 시 loadError=true를 반환한다', () => {
    const result = parseYeyakCalendar('not json', '2026-07-09')
    expect(result.loadError).toBe(true)
    expect(result.kind).toBe('unavailable')
  })

  it('구조 불일치(resultListTm 없음) 시 loadError=true를 반환한다', () => {
    const result = parseYeyakCalendar('{}', '2026-07-09')
    expect(result.loadError).toBe(true)
    expect(result.kind).toBe('unavailable')
  })
})
