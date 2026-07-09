import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCourtFilters } from './useCourtFilters'
import { DEFAULT_RADIUS_KM } from '@/config/courts'

describe('useCourtFilters', () => {
  it('기본 반경은 DEFAULT_RADIUS_KM이다', () => {
    const { result } = renderHook(() => useCourtFilters())
    expect(result.current.radius).toBe(DEFAULT_RADIUS_KM)
  })

  it('setRadius로 반경을 변경할 수 있다', () => {
    const { result } = renderHook(() => useCourtFilters())
    act(() => result.current.setRadius(5))
    expect(result.current.radius).toBe(5)
  })
})
