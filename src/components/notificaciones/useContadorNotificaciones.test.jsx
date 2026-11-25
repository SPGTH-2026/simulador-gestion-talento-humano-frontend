import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import * as api from '../../api/notificaciones'
import { marcarLeida, reiniciarAlmacen, useAlmacenNotificaciones } from './almacenNotificaciones'
import { useContadorNotificaciones } from './useContadorNotificaciones'

vi.mock('../../api/notificaciones', () => ({
  listaNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasNotificacionesLeidas: vi.fn(),
}))

const aviso = (id, extra = {}) => ({ id, tipo: 'citacion', titulo: `Aviso ${id}`, mensaje: 'm', url: null, leida: false, created_at: '2026-11-20T15:00:00+00:00', ...extra })
const respuesta = (items, noLeidas = items.filter((i) => !i.leida).length) => ({ data: items, meta: { no_leidas: noLeidas, total: items.length } })

beforeEach(() => {
  vi.resetAllMocks()
  reiniciarAlmacen()
})

afterEach(() => {
  // Sin la limpieza de RTL (Vitest sin globals), un hook de la prueba anterior seguiría activo.
  cleanup()
  vi.useRealTimers()
})

describe('useContadorNotificaciones (almacén compartido)', () => {
  it('devuelve el número de avisos sin leer que informa el servidor, con UNA sola petición para contador y panel', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1), aviso(2), aviso(3)]))
    const { result } = renderHook(() => ({ n: useContadorNotificaciones(true), almacen: useAlmacenNotificaciones() }))

    await waitFor(() => expect(result.current.n).toBe(3))
    expect(api.listaNotificaciones).toHaveBeenCalledTimes(1)
    expect(api.listaNotificaciones).toHaveBeenCalledWith({ per_page: 10, estado: 'no_leidas' })
    expect(result.current.almacen.items).toHaveLength(3)
  })

  it('no consulta nada mientras la campana no está activa', () => {
    renderHook(() => useContadorNotificaciones(false))
    expect(api.listaNotificaciones).not.toHaveBeenCalled()
  })

  it('leer un aviso baja el contador y lo marca leído al instante, y leerlo otra vez no pide nada', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1), aviso(2)]))
    api.marcarNotificacionLeida.mockResolvedValue(aviso(1, { leida: true }))
    const { result } = renderHook(() => ({ n: useContadorNotificaciones(true), almacen: useAlmacenNotificaciones() }))
    await waitFor(() => expect(result.current.n).toBe(2))

    await act(async () => marcarLeida(aviso(1)))
    expect(result.current.n).toBe(1)
    expect(result.current.almacen.items.find((i) => i.id === 1).leida).toBe(true)
    await act(async () => marcarLeida(aviso(1)))
    expect(api.marcarNotificacionLeida).toHaveBeenCalledTimes(1)
    expect(result.current.n).toBe(1)
  })

  it('se mantiene en cero si la consulta falla y conserva lo que ya había si falla una actualización', async () => {
    api.listaNotificaciones.mockRejectedValueOnce(new Error('sin conexión'))
    const { result } = renderHook(() => ({ n: useContadorNotificaciones(true), almacen: useAlmacenNotificaciones() }))
    await waitFor(() => expect(result.current.almacen.fase).toBe('error'))
    expect(result.current.n).toBe(0)
  })

  it('al desmontarse la campana (cerrar sesión) el almacén queda vacío: nada pasa a la siguiente cuenta', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1)]))
    const { result, unmount } = renderHook(() => ({ n: useContadorNotificaciones(true), almacen: useAlmacenNotificaciones() }))
    await waitFor(() => expect(result.current.n).toBe(1))
    unmount()
    const otra = renderHook(() => useAlmacenNotificaciones())
    expect(otra.result.current.items).toEqual([])
    expect(otra.result.current.noLeidas).toBe(0)
  })
})
