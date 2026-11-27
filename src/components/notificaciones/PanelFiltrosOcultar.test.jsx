import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import * as api from '../../api/notificaciones'
import { reiniciarAlmacen } from './almacenNotificaciones'
import CampanaNotificaciones from './CampanaNotificaciones'

vi.mock('../../api/notificaciones', () => ({
  listaNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasNotificacionesLeidas: vi.fn(),
  ocultarNotificacion: vi.fn(),
  restaurarNotificacion: vi.fn(),
}))

const aviso = (id, extra = {}) => ({ id, tipo: 'citacion', titulo: `Cita ${id}`, mensaje: 'Tienes la entrevista.', url: `/mis-postulaciones?cita=${id}`, leida: false, oculta: false, created_at: '2026-11-20T15:00:00+00:00', ...extra })
const respuesta = (items, noLeidas = items.filter((i) => !i.leida && !i.oculta).length, extra = {}) => ({ data: items, meta: { no_leidas: noLeidas, ocultas: 0, total: items.length, ...extra } })
const diferida = () => {
  let resolver
  const promesa = new Promise((r) => { resolver = r })
  return { promesa, resolver }
}
const campana = () => screen.getByRole('button', { name: /^Notificaciones/ })
const abrir = async () => {
  fireEvent.click(campana())
  return screen.findByRole('dialog', { name: 'Notificaciones' })
}

beforeEach(() => {
  vi.clearAllMocks()
  api.listaNotificaciones.mockImplementation(async ({ estado }) => respuesta(estado === 'leidas' ? [] : [aviso(1), aviso(2, { leida: true })], 1))
})
afterEach(() => {
  reiniciarAlmacen()
  cleanup()
})
const montar = () => render(<MemoryRouter><CampanaNotificaciones /></MemoryRouter>)

describe('Panel: filtros', () => {
  it('ofrece Todas, No leídas y Leídas (sin Ocultas), pide cada filtro al servidor y distingue «sin notificaciones» de «sin resultados en el filtro»', async () => {
    montar()
    const panel = await abrir()
    const filtros = within(panel).getByRole('group', { name: 'Filtrar notificaciones' })
    expect(within(filtros).getAllByRole('button').map((b) => b.textContent)).toEqual(['Todas', 'No leídas', 'Leídas'])
    // Vista predeterminada: No leídas.
    expect(within(filtros).getByRole('button', { name: 'No leídas' }).getAttribute('aria-pressed')).toBe('true')
    expect(api.listaNotificaciones).toHaveBeenCalledWith({ per_page: 10, estado: 'no_leidas' })

    fireEvent.click(within(filtros).getByRole('button', { name: 'Leídas' }))
    expect(await within(panel).findByText('No hay notificaciones en este filtro')).toBeTruthy()
    expect(within(panel).queryByText('No tienes notificaciones')).toBeNull()
    expect(api.listaNotificaciones).toHaveBeenLastCalledWith({ per_page: 10, estado: 'leidas' })
    expect(within(filtros).getByRole('button', { name: 'Leídas' }).getAttribute('aria-pressed')).toBe('true')

    api.listaNotificaciones.mockResolvedValue(respuesta([]))
    fireEvent.click(within(filtros).getByRole('button', { name: 'Todas' }))
    expect(await within(panel).findByText('No tienes notificaciones')).toBeTruthy()
  })

  it('sin pendientes dice «Estás al día» sin botones redundantes; mientras carga muestra «Cargando notificaciones…» y nunca un vacío', async () => {
    const lenta = diferida()
    api.listaNotificaciones.mockReturnValue(lenta.promesa)
    montar()
    const panel = await abrir()
    expect(within(panel).getByRole('status').textContent).toMatch(/Cargando notificaciones/)
    expect(within(panel).queryByText(/Estás al día|No tienes notificaciones/)).toBeNull() // y sin afirmar «vacío» antes de saberlo
    await act(async () => lenta.resolver(respuesta([], 0)))
    expect(await within(panel).findByText('Estás al día')).toBeTruthy()
    expect(within(panel).queryByRole('button', { name: /Consultar/ })).toBeNull()
    expect(within(panel).queryByText(/historial/i)).toBeNull()
  })

  it('descarta la respuesta tardía de un filtro anterior', async () => {
    const lenta = diferida()
    api.listaNotificaciones.mockImplementation(({ estado }) => (estado === 'no_leidas' ? lenta.promesa : Promise.resolve(respuesta([aviso(7, { leida: true, titulo: 'Solo leída' })], 0))))
    montar()
    const panel = await abrir()
    fireEvent.click(within(panel).getByRole('button', { name: 'No leídas' }))
    fireEvent.click(within(panel).getByRole('button', { name: 'Leídas' }))
    expect(await within(panel).findByText('Solo leída')).toBeTruthy()
    await act(async () => lenta.resolver(respuesta([aviso(9, { titulo: 'Tardía' })])))
    expect(within(panel).queryByText('Tardía')).toBeNull()
    expect(within(panel).getByText('Solo leída')).toBeTruthy()
  })

  it('con más avisos de los mostrados lo dice y «Ver todas» queda como enlace discreto', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta(Array.from({ length: 10 }, (_, i) => aviso(i + 1)), 23, { total: 23 }))
    montar()
    const panel = await abrir()
    expect(await within(panel).findByText('Las 10 más recientes de 23')).toBeTruthy()
    expect(within(panel).getByRole('link', { name: 'Ver todas las notificaciones' }).textContent).toBe('Ver todas')
  })
})

describe('Panel: ocultar', () => {
  it('cada aviso tiene su X «Ocultar notificación», distinta del cierre, hermana de la tarjeta (sin controles anidados)', async () => {
    montar()
    const panel = await abrir()
    await within(panel).findByText('Cita 1')
    const ocultar = within(panel).getAllByRole('button', { name: 'Ocultar notificación' })
    expect(ocultar).toHaveLength(2)
    expect(within(panel).getAllByRole('button', { name: 'Cerrar notificaciones' })).toHaveLength(1)
    panel.querySelectorAll('li').forEach((li) => expect(li.querySelector('button button, a button, button a')).toBeNull())
    expect(within(panel).getAllByText('Ocultar notificación', { selector: 'span' }).length).toBe(2) // ayuda visible al enfocar o pasar el puntero
  })

  it('ocultar un aviso sin leer lo saca del panel, baja los pendientes, NO lo marca leído y no se repite con doble clic', async () => {
    const lenta = diferida()
    api.ocultarNotificacion.mockReturnValueOnce(lenta.promesa)
    montar()
    const panel = await abrir()
    await within(panel).findByText('Cita 1')
    await waitFor(() => expect(campana().getAttribute('aria-label')).toBe('Notificaciones, 1 sin leer'))
    const x = within(panel).getAllByRole('button', { name: 'Ocultar notificación' })[0]
    fireEvent.click(x)
    fireEvent.click(x)
    expect(api.ocultarNotificacion).toHaveBeenCalledTimes(1)
    // Inmediato: la fila sale y el contador baja sin esperar a la respuesta del servidor.
    expect(within(panel).queryByText('Cita 1')).toBeNull()
    expect(campana().getAttribute('aria-label')).toBe('Notificaciones')
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(2, { leida: true })], 0, { ocultas: 1 }))
    await act(async () => lenta.resolver(aviso(1, { oculta: true })))
    await waitFor(() => expect(within(panel).queryByText('Cita 1')).toBeNull())
    expect(api.marcarNotificacionLeida).not.toHaveBeenCalled()
    await waitFor(() => expect(campana().getAttribute('aria-label')).toBe('Notificaciones'))
  })

  it('si ocultar falla se explica, el aviso sigue visible y se puede intentar de nuevo', async () => {
    api.ocultarNotificacion.mockRejectedValueOnce(new Error('sin red'))
    montar()
    const panel = await abrir()
    await within(panel).findByText('Cita 1')
    fireEvent.click(within(panel).getAllByRole('button', { name: 'Ocultar notificación' })[0])
    expect(await within(panel).findByText(/no pudimos conectarnos/i)).toBeTruthy()
    // Se deshizo: el aviso vuelve a su lugar y el contador a su valor.
    expect(within(panel).getByText('Cita 1')).toBeTruthy()
    expect(campana().getAttribute('aria-label')).toBe('Notificaciones, 1 sin leer')
  })
})
