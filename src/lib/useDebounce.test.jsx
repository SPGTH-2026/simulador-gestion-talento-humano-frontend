import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useDebounce from './useDebounce'

afterEach(() => {
  vi.useRealTimers()
})

describe('useDebounce', () => {
  it('no cambia mientras el valor sigue escribiéndose y lo entrega tras el retraso', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ valor }) => useDebounce(valor, 300), {
      initialProps: { valor: 'a' },
    })

    rerender({ valor: 'ab' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('a')

    rerender({ valor: 'abc' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('abc')
  })
})
