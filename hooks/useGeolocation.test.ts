import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGeolocation } from './useGeolocation'
import { YEOUIDO_FALLBACK } from '@/config/courts'

describe('useGeolocation', () => {
  beforeEach(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: vi.fn() },
      configurable: true,
    })
  })

  it('마운트 시 위치를 요청하고, 허용되면 실위치로 갱신된다', async () => {
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) => {
      success({ coords: { latitude: 37.5, longitude: 127.0 } } as GeolocationPosition)
    })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => expect(result.current.location.source).toBe('gps'))
    expect(result.current.location).toMatchObject({ lat: 37.5, lng: 127.0, source: 'gps' })
  })

  it('거부되면 여의도 fallback 좌표를 사용한다', async () => {
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((_success, error) => {
      error?.({} as GeolocationPositionError)
    })

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => expect(result.current.location.source).toBe('fallback'))
    expect(result.current.location).toMatchObject({ ...YEOUIDO_FALLBACK, source: 'fallback' })
  })

  it('requestLocation을 다시 호출하면 geolocation이 재요청된다', async () => {
    vi.mocked(navigator.geolocation.getCurrentPosition).mockImplementation((success) => {
      success({ coords: { latitude: 1, longitude: 2 } } as GeolocationPosition)
    })

    const { result } = renderHook(() => useGeolocation())
    await waitFor(() => expect(result.current.location.source).toBe('gps'))

    act(() => result.current.requestLocation())

    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(2)
  })
})
