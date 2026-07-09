import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeFilterButton } from './time-filter-button'

describe('TimeFilterButton', () => {
  it('선택 없으면 "전체"를 표시한다', () => {
    render(<TimeFilterButton selectedHours={[]} onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: '시간 전체' })).toBeInTheDocument()
  })

  it('불연속 구간(12-14, 18-22)을 요약해 표시한다', () => {
    render(<TimeFilterButton selectedHours={[12, 13, 18, 19, 20, 21]} onClick={vi.fn()} />)
    expect(screen.getByRole('button', { name: '시간 12-14, 18-22' })).toBeInTheDocument()
  })

  it('클릭 시 onClick이 호출된다', async () => {
    const onClick = vi.fn()
    render(<TimeFilterButton selectedHours={[]} onClick={onClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
