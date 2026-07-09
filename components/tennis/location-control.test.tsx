import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocationControl } from './location-control'

describe('LocationControl', () => {
  it('fallback 위치면 안내 문구와 "현재 위치 사용하기" 버튼이 보인다', () => {
    render(<LocationControl location={{ lat: 37.52, lng: 126.92, source: 'fallback' }} onRequestLocation={vi.fn()} />)
    expect(screen.getByText('기본 위치(여의도) 사용 중')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '현재 위치 사용하기' })).toBeInTheDocument()
  })

  it('gps 위치면 안내 문구 없이 "현재 위치"만 표시된다', () => {
    render(<LocationControl location={{ lat: 37.5, lng: 127.0, source: 'gps' }} onRequestLocation={vi.fn()} />)
    expect(screen.getByText('현재 위치')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '현재 위치 사용하기' })).not.toBeInTheDocument()
  })

  it('"현재 위치 사용하기" 클릭 시 onRequestLocation이 호출된다', async () => {
    const onRequestLocation = vi.fn()
    render(<LocationControl location={{ lat: 37.52, lng: 126.92, source: 'fallback' }} onRequestLocation={onRequestLocation} />)
    await userEvent.click(screen.getByRole('button', { name: '현재 위치 사용하기' }))
    expect(onRequestLocation).toHaveBeenCalledTimes(1)
  })
})
