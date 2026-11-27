import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as api from '../../api/notificaciones'
import { reiniciarAlmacen } from '../../components/notificaciones/almacenNotificaciones'
import Notificaciones from './Notificaciones'

vi.mock('../../api/notificaciones', () => ({
  listaNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasNotificacionesLeidas: vi.fn(),
  ocultarNotificacion: vi.fn(),
  restaurarNotificacion: vi.fn(),
}))

const aviso = (id, extra = {}) => ({ id, tipo: 'citacion', titulo: `Cita ${id}`, mensaje: 'Mensaje.', url: '/mis-postulaciones', leida: false, oculta: false, created_at: '2026-11-20T15:00:00+00:00', ...extra })
const resp = (items, meta = {}) => ({ data: items, meta: { current_page: 1, last_page: 1, per_page: 20, total: items.length, no_leidas: 0, ocultas: 0, ...meta } })
const montar = (ruta = '/notificaciones?filtro=todas') => render(<MemoryRouter initialEntries={[ruta]}><Notificaciones /></MemoryRouter>)

afterEach(() => {
  reiniciarAlmacen()
  cleanup()
  vi.clearAllMocks()
})

describe('Página de notificaciones: filtros y ocultas', () => {
  it('ofrece Todas, No leídas, Leídas y Ocultas; cada filtro se pide al servidor y reinicia la página', async () => {
    api.listaNotificaciones.mockImplementation(async ({ page }) => resp([aviso(page * 10)], { current_page: page, last_page: 3, total: 3, no_leidas: 1 }))
    montar()
    await screen.findByText('Cita 10')
    const filtros = screen.getByRole('group', { name: 'Filtrar notificaciones' })
    expect(within(filtros).getAllByRole('button').map((b) => b.textContent)).toEqual(['Todas', 'No leídas', 'Leídas', 'Ocultas'])

    fireEvent.click(within(screen.getByRole('navigation', { name: /paginación/i })).getByRole('button', { name: /siguiente/i }))
    expect(await screen.findByText('Cita 20')).toBeTruthy()
    fireEvent.click(within(filtros).getByRole('button', { name: 'No leídas' }))
    expect(await screen.findByText('Cita 10')).toBeTruthy()
    expect(api.listaNotificaciones).toHaveBeenLastCalledWith({ page: 1, estado: 'no_leidas' })
  })

  it('en «Ocultas» se ve Restaurar (no la X), se explica el efecto y no se ofrece marcar todas; restaurar devuelve el aviso y recalcula los pendientes', async () => {
    api.listaNotificaciones.mockImplementation(async ({ estado }) => (estado === 'ocultas' ? resp([aviso(5, { oculta: true })], { ocultas: 1 }) : resp([aviso(5)], { no_leidas: 1 })))
    api.restaurarNotificacion.mockResolvedValue(aviso(5))
    montar()
    await screen.findByText('Cita 5')
    expect(screen.getByRole('button', { name: /marcar todas/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ocultas' }))
    expect(await screen.findByRole('button', { name: 'Restaurar' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Ocultar notificación' })).toBeNull()
    expect(screen.queryByRole('button', { name: /marcar todas/i })).toBeNull()
    expect(screen.getByText(/no cuentan como pendientes y conservan su estado de lectura/i)).toBeTruthy()
    // Sin depuración activa (meta.retencion = null) no se anuncia ningún plazo.
    expect(screen.queryByText(/Se eliminan/)).toBeNull()

    api.listaNotificaciones.mockImplementation(async ({ estado }) => resp(estado === 'ocultas' ? [] : [aviso(5)], { no_leidas: 1 }))
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }))
    expect(await screen.findByText('No hay notificaciones en este filtro')).toBeTruthy()
    expect(api.restaurarNotificacion).toHaveBeenCalledTimes(1)
  })

  it('si ocultar deja vacía una página posterior vuelve a una válida', async () => {
    const pedidas = []
    api.listaNotificaciones.mockImplementation(async ({ page }) => {
      pedidas.push(page)
      if (page === 1) return resp([aviso(1)], { current_page: 1, last_page: 2, total: 21, no_leidas: 1 })
      if (pedidas.filter((p) => p === 2).length === 1) return resp([aviso(21)], { current_page: 2, last_page: 2, total: 21, no_leidas: 1 })
      return resp([], { current_page: 2, last_page: 1, total: 20, no_leidas: 0 })
    })
    api.ocultarNotificacion.mockResolvedValue(aviso(21, { oculta: true }))
    montar()
    await screen.findByText('Cita 1')
    fireEvent.click(within(screen.getByRole('navigation', { name: /paginación/i })).getByRole('button', { name: /siguiente/i }))
    await screen.findByText('Cita 21')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar notificación' }))
    await waitFor(() => expect(pedidas.at(-1)).toBe(1))
    expect(await screen.findByText('Cita 1')).toBeTruthy()
  })

  it('ocultar desde la página conserva los datos visibles mientras se actualiza (sin volver al esqueleto)', async () => {
    api.listaNotificaciones.mockResolvedValue(resp([aviso(1), aviso(2)], { no_leidas: 2 }))
    api.ocultarNotificacion.mockResolvedValue(aviso(1, { oculta: true }))
    montar()
    await screen.findByText('Cita 1')
    api.listaNotificaciones.mockResolvedValue(resp([aviso(2)], { no_leidas: 1, ocultas: 1 }))
    fireEvent.click(screen.getAllByRole('button', { name: 'Ocultar notificación' })[0])
    await waitFor(() => expect(screen.queryByText('Cita 1')).toBeNull())
    expect(screen.getByText('Cita 2')).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('anuncia el plazo de eliminación solo cuando el servidor informa que la depuración está activa', async () => {
    const retencion = { ocultas_dias: 30, leidas_dias: 30 }
    api.listaNotificaciones.mockImplementation(async ({ estado }) => resp(estado === 'ocultas' ? [aviso(5, { oculta: true })] : [aviso(6, { leida: true })], { retencion }))
    montar('/notificaciones?filtro=ocultas')
    expect(await screen.findByText(/Se eliminan 30 días después de ocultarlas/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Leídas' }))
    expect(await screen.findByText('Las notificaciones leídas se eliminan 30 días después de leerlas.')).toBeTruthy()
  })
})
