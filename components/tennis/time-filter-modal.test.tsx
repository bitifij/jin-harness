import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeFilterModal } from './time-filter-modal'

describe('TimeFilterModal', () => {
  it('시간 셀 클릭 시 onToggleHour가 해당 시간으로 호출된다', async () => {
    const onToggleHour = vi.fn()
    render(
      <TimeFilterModal open selectedHours={[]} onOpenChange={vi.fn()} onToggleHour={onToggleHour} onClear={vi.fn()} />,
    )
    await userEvent.click(screen.getByLabelText('18시-19시'))
    expect(onToggleHour).toHaveBeenCalledWith(18)
  })

  it('선택된 시간 셀은 aria-pressed=true다', () => {
    render(
      <TimeFilterModal open selectedHours={[12, 13]} onOpenChange={vi.fn()} onToggleHour={vi.fn()} onClear={vi.fn()} />,
    )
    expect(screen.getByLabelText('12시-13시')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('14시-15시')).toHaveAttribute('aria-pressed', 'false')
  })

  it('"전체 해제" 클릭 시 onClear가 호출된다', async () => {
    const onClear = vi.fn()
    render(
      <TimeFilterModal open selectedHours={[12]} onOpenChange={vi.fn()} onToggleHour={vi.fn()} onClear={onClear} />,
    )
    await userEvent.click(screen.getByRole('button', { name: '전체 해제' }))
    expect(onClear).toHaveBeenCalled()
  })

  it('"적용" 클릭 시 onOpenChange(false)가 호출된다', async () => {
    const onOpenChange = vi.fn()
    render(
      <TimeFilterModal open selectedHours={[12]} onOpenChange={onOpenChange} onToggleHour={vi.fn()} onClear={vi.fn()} />,
    )
    await userEvent.click(screen.getByRole('button', { name: '적용' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
