import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateSelector } from './date-selector'

describe('DateSelector', () => {
  it('선택된 날짜마다 칩이 표시된다', () => {
    render(<DateSelector dates={['2026-07-22', '2026-07-25']} onDatesChange={vi.fn()} />)
    expect(screen.getByText('07/22')).toBeInTheDocument()
    expect(screen.getByText('07/25')).toBeInTheDocument()
  })

  it('칩의 ✕ 클릭 시 해당 날짜만 해제된 배열로 onDatesChange가 호출된다', async () => {
    const onDatesChange = vi.fn()
    render(<DateSelector dates={['2026-07-22', '2026-07-25']} onDatesChange={onDatesChange} />)
    await userEvent.click(screen.getByLabelText('2026-07-22 선택 해제'))
    expect(onDatesChange).toHaveBeenCalledWith(['2026-07-25'])
  })

  it('"평일" 프리셋 클릭 시 조회범위 내 평일 날짜만 전달된다', async () => {
    const onDatesChange = vi.fn()
    // 2026-07-09(목)부터 7일: 07-09(목)~07-15(수) 중 평일만
    render(<DateSelector dates={[]} onDatesChange={onDatesChange} rangeDays={7} now={new Date('2026-07-09T09:00:00')} />)
    await userEvent.click(screen.getByRole('button', { name: '평일' }))
    expect(onDatesChange).toHaveBeenCalledWith(['2026-07-09', '2026-07-10', '2026-07-13', '2026-07-14', '2026-07-15'])
  })

  it('"주말" 프리셋 클릭 시 조회범위 내 주말 날짜만 전달된다', async () => {
    const onDatesChange = vi.fn()
    render(<DateSelector dates={[]} onDatesChange={onDatesChange} rangeDays={7} now={new Date('2026-07-09T09:00:00')} />)
    await userEvent.click(screen.getByRole('button', { name: '주말' }))
    expect(onDatesChange).toHaveBeenCalledWith(['2026-07-11', '2026-07-12'])
  })

  it('"날짜 선택" 클릭 시 캘린더가 열린다', async () => {
    render(<DateSelector dates={[]} onDatesChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: '날짜 선택' }))
    expect(await screen.findByRole('grid')).toBeInTheDocument()
  })
})
