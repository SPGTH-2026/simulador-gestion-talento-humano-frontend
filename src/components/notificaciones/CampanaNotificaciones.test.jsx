import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import * as api from '../../api/notificaciones'
import { reiniciarAlmacen } from './almacenNotificaciones'
import CampanaNotificaciones from './CampanaNotificaciones'

vi.mock('../../api/notificaciones', () => ({
  listaNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasNotificacionesLeidas: vi.fn(),
}))

const aviso = (id, extra = {}) => ({ id, tipo: 'citacion', titulo: `Cita ${id}`, mensaje: 'Tienes la entrevista (hora de Colombia).', url: `/mis-postulaciones?cita=${id}`, leida: false, created_at: '2026-11-20T15:00:00+00:00', ...extra })
const respuesta = (items, noLeidas = items.filter((i) => !i.leida).length) => ({ data: items, meta: { no_leidas: noLeidas, total: items.length } })

function montar() {
  return render(
    <MemoryRouter initialEntries={['/inicio']}>
      <input aria-label="Escribe algo" />
      <CampanaNotificaciones />
      <Routes>
        <Route path="/inicio" element={<p>Inicio</p>} />
        <Route path="/notificaciones" element={<p>Página de notificaciones</p>} />
        <Route path="/mis-postulaciones" element={<p>Pantalla de postulaciones</p>} />
      </Routes>
    </MemoryRouter>,
  )
}
const campana = () => screen.getByRole('button', { name: /^Notificaciones/ })

beforeEach(() => vi.clearAllMocks())
afterEach(() => {
  reiniciarAlmacen()
  cleanup()
})

describe('Campana con panel desplegable', () => {
  it('abrir el panel NO marca nada como leído, muestra cabecera, contador y «Ver todas», y lleva el foco al título', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1), aviso(2, { leida: true })]))
    montar()
    await waitFor(() => expect(campana().getAttribute('aria-label')).toBe('Notificaciones, 1 sin leer'))

    fireEvent.click(campana())
    const panel = await screen.findByRole('dialog', { name: 'Notificaciones' })
    expect(campana().getAttribute('aria-expanded')).toBe('true')
    expect(within(panel).getByText('1 sin leer')).toBeTruthy()
    expect(within(panel).getByRole('link', { name: 'Ver todas las notificaciones' }).getAttribute('href')).toBe('/notificaciones?filtro=todas')
    expect(document.activeElement).toBe(within(panel).getByRole('heading', { name: 'Notificaciones' }))
    expect(api.marcarNotificacionLeida).not.toHaveBeenCalled()
    // El mensaje no repite la aclaración horaria.
    expect(within(panel).getAllByText('Tienes la entrevista.')).toHaveLength(2)
  })

  it('Escape, el botón de cierre, la campana y el clic fuera lo cierran; los dos primeros y la campana devuelven el foco a la campana', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1)]))
    montar()
    await waitFor(() => expect(api.listaNotificaciones).toHaveBeenCalled())

    fireEvent.click(campana())
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(campana())

    fireEvent.click(campana())
    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar notificaciones' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(campana())

    fireEvent.click(campana())
    await screen.findByRole('dialog')
    fireEvent.click(campana())
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(campana())
    await screen.findByRole('dialog')
    fireEvent.pointerDown(screen.getByLabelText('Escribe algo'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('abrir y cerrar no pierde lo escrito en el formulario de fondo', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1)]))
    montar()
    fireEvent.change(screen.getByLabelText('Escribe algo'), { target: { value: 'borrador importante' } })
    fireEvent.click(campana())
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByLabelText('Escribe algo').value).toBe('borrador importante')
  })

  it('consultar un aviso lo marca leído una sola vez, baja el contador, navega al destino y cierra el panel', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(7), aviso(8)]))
    api.marcarNotificacionLeida.mockResolvedValue(aviso(7, { leida: true }))
    montar()
    await waitFor(() => expect(campana().getAttribute('aria-label')).toBe('Notificaciones, 2 sin leer'))
    fireEvent.click(campana())
    const panel = await screen.findByRole('dialog')

    // «Ver citación» es un enlace real de la tarjeta de ese aviso.
    const enlace = within(within(panel).getByText('Cita 7').closest('li')).getByRole('link', { name: 'Ver citación' })
    expect(enlace.getAttribute('href')).toBe('/mis-postulaciones?cita=7')
    fireEvent.click(enlace)

    expect(await screen.findByText('Pantalla de postulaciones')).toBeTruthy()
    expect(api.marcarNotificacionLeida).toHaveBeenCalledTimes(1)
    expect(api.marcarNotificacionLeida).toHaveBeenCalledWith(7)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(campana().getAttribute('aria-label')).toBe('Notificaciones, 1 sin leer')
  })

  it('«Ver todas» lleva a la página y cierra el panel', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1)]))
    montar()
    fireEvent.click(campana())
    fireEvent.click(await screen.findByRole('link', { name: 'Ver todas las notificaciones' }))
    expect(await screen.findByText('Página de notificaciones')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('con la lista vacía lo dice, y un error de red se explica con reintento y se recupera', async () => {
    api.listaNotificaciones.mockRejectedValueOnce(new Error('sin red')).mockResolvedValueOnce(respuesta([])).mockResolvedValue(respuesta([aviso(1)]))
    montar()
    await waitFor(() => expect(api.listaNotificaciones).toHaveBeenCalledTimes(1))
    fireEvent.click(campana())
    const panel = await screen.findByRole('dialog')
    await waitFor(() => expect(api.listaNotificaciones).toHaveBeenCalledTimes(2))
    expect(await within(panel).findByText('Estás al día')).toBeTruthy()
  })

  it('si no se pudo cargar y no hay nada que mostrar, ofrece reintentar', async () => {
    api.listaNotificaciones.mockRejectedValue(new Error('sin red'))
    montar()
    fireEvent.click(campana())
    const panel = await screen.findByRole('dialog')
    expect(await within(panel).findByText(/no pudimos conectarnos/i)).toBeTruthy()
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1)]))
    fireEvent.click(within(panel).getByRole('button', { name: 'Reintentar' }))
    expect(await within(panel).findByText('Cita 1')).toBeTruthy()
  })

  it('un aviso sin destino no es navegable y ofrece «Marcar como leída»', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(3, { url: null, tipo: 'pendientes_evaluar', titulo: 'Resumen' })]))
    api.marcarNotificacionLeida.mockResolvedValue(aviso(3, { url: null, leida: true, titulo: 'Resumen' }))
    montar()
    fireEvent.click(campana())
    const panel = await screen.findByRole('dialog')
    expect(within(panel).queryByRole('button', { name: /Resumen/ })).toBeNull()
    fireEvent.click(within(panel).getByRole('button', { name: 'Marcar como leída' }))
    await waitFor(() => expect(within(panel).queryByRole('button', { name: 'Marcar como leída' })).toBeNull())
    expect(api.marcarNotificacionLeida).toHaveBeenCalledWith(3)
  })

  it('la campana se resalta como activa con el panel abierto o en /notificaciones, sin confundirse con tener avisos', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([]))
    montar()
    await waitFor(() => expect(api.listaNotificaciones).toHaveBeenCalled())
    expect(campana().className).not.toMatch(/\sbg-sena-hundido/)
    fireEvent.click(campana())
    await screen.findByRole('dialog')
    expect(campana().className).toMatch(/\sbg-sena-hundido/)
    expect(campana().getAttribute('aria-expanded')).toBe('true')
    expect(campana().getAttribute('aria-haspopup')).toBe('dialog')
    expect(campana().getAttribute('aria-current')).toBeNull()
    cleanup()
    render(<MemoryRouter initialEntries={['/notificaciones']}><CampanaNotificaciones /></MemoryRouter>)
    expect(campana().className).toMatch(/\sbg-sena-hundido/)
    expect(campana().getAttribute('aria-current')).toBe('page')
  })

  it('«Ver citación» y «Marcar como leída» son enlaces de texto del mismo estilo, hermanos y sin anidar; leídas y sin leer se distinguen', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso(1), aviso(2, { leida: true })]))
    montar()
    fireEvent.click(campana())
    const panel = await screen.findByRole('dialog')
    const [sinLeer, leida] = await within(panel).findAllByRole('listitem')
    const ver = within(sinLeer).getByRole('link', { name: 'Ver citación' })
    const marcar = within(sinLeer).getByRole('button', { name: 'Marcar como leída' })
    expect(ver.className).toBe(marcar.className)
    expect(ver.closest('button, a:not(:scope)')).toBeNull()
    expect(within(leida).queryByRole('button', { name: 'Marcar como leída' })).toBeNull()
    expect(within(leida).getByRole('link', { name: 'Ver citación' })).toBeTruthy()
    expect(within(sinLeer).getByText('Nueva')).toBeTruthy()
    expect(within(sinLeer).getByText('Cita 1').className).toMatch(/font-bold/)
    expect(within(leida).queryByText('Nueva')).toBeNull()
    expect(within(leida).getByText('Cita 2').className).not.toMatch(/font-bold/)
    expect(leida.querySelectorAll('span[aria-hidden="true"].rounded-full')).toHaveLength(0)
  })
})
