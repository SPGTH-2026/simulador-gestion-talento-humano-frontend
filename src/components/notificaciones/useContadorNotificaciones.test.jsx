import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import * as api from '../../api/notificaciones'
import { avisarCambioNotificaciones, useContadorNotificaciones } from './useContadorNotificaciones'

vi.mock('../../api/notificaciones', () => ({
  listaNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasNotificacionesLeidas: vi.fn(),
}))

const conNoLeidas = (n) => ({ data: [], meta: { no_leidas: n } })

beforeEach(() => {
  vi.resetAllMocks()
})

afterEach(() => {
  // Sin la limpieza de RTL (Vitest sin globals), un hook de la prueba anterior seguiría escuchando el aviso de cambio.
  cleanup()
  vi.useRealTimers()
})

describe('useContadorNotificaciones', () => {
  it('devuelve el número de avisos sin leer que informa el servidor', async () => {
    api.listaNotificaciones.mockResolvedValue(conNoLeidas(3))

    const { result } = renderHook(() => useContadorNotificaciones(true))

    await waitFor(() => expect(result.current).toBe(3))
    expect(api.listaNotificaciones).toHaveBeenCalledWith({ per_page: 1 })
  })

  it('no consulta nada mientras la campana no está activa', () => {
    renderHook(() => useContadorNotificaciones(false))

    expect(api.listaNotificaciones).not.toHaveBeenCalled()
  })

  it('vuelve a consultar cuando otra parte de la app avisa de un cambio', async () => {
    api.listaNotificaciones.mockResolvedValueOnce(conNoLeidas(2)).mockResolvedValueOnce(conNoLeidas(0))

    const { result } = renderHook(() => useContadorNotificaciones(true))
    await waitFor(() => expect(result.current).toBe(2))

    act(() => avisarCambioNotificaciones())

    await waitFor(() => expect(result.current).toBe(0))
    expect(api.listaNotificaciones).toHaveBeenCalledTimes(2)
  })

  it('se mantiene en cero si la consulta falla', async () => {
    api.listaNotificaciones.mockRejectedValue(new Error('sin conexión'))

    const { result } = renderHook(() => useContadorNotificaciones(true))

    await waitFor(() => expect(api.listaNotificaciones).toHaveBeenCalled())
    expect(result.current).toBe(0)
  })
})
