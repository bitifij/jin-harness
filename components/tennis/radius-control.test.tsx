import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RadiusControl } from './radius-control'

describe('RadiusControl', () => {
  it('현재 반경을 표시한다', () => {
    render(<RadiusControl radius={10} onRadiusChange={vi.fn()} />)
    expect(screen.getByText('10km')).toBeInTheDocument()
  })

  it('슬라이더 값 변경 시 onRadiusChange가 호출된다', () => {
    const onRadiusChange = vi.fn()
    render(<RadiusControl radius={10} onRadiusChange={onRadiusChange} />)
    const slider = screen.getByRole('slider')
    slider.focus()
    // Radix Slider는 키보드로도 값 변경 가능 — ArrowRight 1회에 step(5)만큼 증가
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onRadiusChange).toHaveBeenCalledWith(15)
  })
})
