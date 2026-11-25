import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Notificaciones from './Notificaciones'
import * as api from '../../api/notificaciones'
import { reiniciarAlmacen } from '../../components/notificaciones/almacenNotificaciones'

vi.mock('../../api/notificaciones', () => ({
  listaNotificaciones: vi.fn(),
  marcarNotificacionLeida: vi.fn(),
  marcarTodasNotificacionesLeidas: vi.fn(),
}))

const aviso = (extra) => ({
  tipo: 'correccion_solicitada',
  mensaje: 'Corrige tu documento.',
  url: null,
  leida: false,
  leida_at: null,
  created_at: '2026-11-20T15:00:00+00:00',
  ...extra,
})

const respuesta = (items, noLeidas = items.filter((i) => !i.leida).length) => ({
  data: items,
  meta: { current_page: 1, last_page: 1, per_page: 20, total: items.length, no_leidas: noLeidas },
})

function montar(ruta = '/notificaciones?filtro=todas') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/mis-postulaciones" element={<p>Pantalla de postulaciones</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  reiniciarAlmacen()
  cleanup()
  vi.clearAllMocks()
})

describe('Página de notificaciones', () => {
  it('muestra un mensaje claro cuando no hay avisos', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([]))

    montar()

    expect(await screen.findByText('No tienes notificaciones')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /marcar todas/i })).toBeNull()
  })

  it('sin «?filtro=» entra en No leídas y respeta el filtro que indique el enlace', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([]))
    montar('/notificaciones')
    await screen.findByText('Estás al día')
    expect(api.listaNotificaciones).toHaveBeenLastCalledWith({ page: 1, estado: 'no_leidas' })
    expect(screen.getByRole('button', { name: 'No leídas' }).getAttribute('aria-pressed')).toBe('true')
    cleanup()
    montar('/notificaciones?filtro=leidas')
    await screen.findByText('No hay notificaciones en este filtro')
    expect(api.listaNotificaciones).toHaveBeenLastCalledWith({ page: 1, estado: 'leidas' })
    cleanup()
    montar('/notificaciones?filtro=inventado')
    await screen.findByText('Estás al día')
  })

  it('sin pendientes dice «Estás al día» sin negar el historial ni botones redundantes; Todas muestra el historial', async () => {
    api.listaNotificaciones.mockImplementation(async ({ estado }) => respuesta(estado === 'todas' ? [aviso({ id: 4, titulo: 'Aviso viejo', leida: true })] : []))
    montar('/notificaciones')
    expect(await screen.findByText('Estás al día')).toBeTruthy()
    expect(screen.getByText('No tienes notificaciones sin leer.')).toBeTruthy()
    expect(screen.queryByText(/historial/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /Consultar/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))
    expect(await screen.findByText('Aviso viejo')).toBeTruthy()
  })

  it('marca como nuevas las que no se han leído y ofrece marcar todas', async () => {
    api.listaNotificaciones.mockResolvedValue(
      respuesta([
        aviso({ id: 1, titulo: 'Debes corregir documentos' }),
        aviso({ id: 2, titulo: 'Tu evaluación fue finalizada', leida: true, leida_at: '2026-11-21T10:00:00+00:00' }),
      ]),
    )

    montar()

    const lista = await screen.findByRole('list', { name: /lista de notificaciones/i })
    const items = within(lista).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('Nueva')).toBeTruthy()
    expect(within(items[1]).queryByText('Nueva')).toBeNull()
    expect(screen.getByRole('button', { name: /marcar todas como leídas/i })).toBeTruthy()
  })

  it('al abrir un aviso sin leer lo marca y lleva a su destino', async () => {
    api.listaNotificaciones.mockResolvedValue(
      respuesta([aviso({ id: 7, titulo: 'Debes corregir documentos', url: '/mis-postulaciones' })]),
    )
    api.marcarNotificacionLeida.mockResolvedValue(
      aviso({ id: 7, titulo: 'Debes corregir documentos', url: '/mis-postulaciones', leida: true }),
    )

    montar()
    // «Ver postulación» es un enlace real de texto; la tarjeta ya no es un botón.
    const enlace = await screen.findByRole('link', { name: 'Ver postulación' })
    expect(screen.queryByRole('button', { name: /debes corregir documentos/i })).toBeNull()
    fireEvent.click(enlace)

    expect(await screen.findByText('Pantalla de postulaciones')).toBeTruthy()
    await waitFor(() => expect(api.marcarNotificacionLeida).toHaveBeenCalledWith(7))
  })

  it('si un aviso no tiene destino, solo se marca como leído', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso({ id: 3, titulo: 'Aviso sin destino' })]))
    api.marcarNotificacionLeida.mockResolvedValue(aviso({ id: 3, titulo: 'Aviso sin destino', leida: true }))

    montar()
    // Sin destino no parece navegable: no hay botón de fila ni acción, solo «Marcar como leída».
    expect(screen.queryByText(/^Ver /)).toBeNull()
    expect(screen.queryByRole('button', { name: /aviso sin destino/i })).toBeNull()
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar como leída' }))

    await waitFor(() => expect(screen.queryByText('Nueva')).toBeNull())
    expect(screen.queryByText('Pantalla de postulaciones')).toBeNull()
  })

  it('marcar todas como leídas llama a la API y vuelve a cargar la lista', async () => {
    api.listaNotificaciones
      .mockResolvedValueOnce(respuesta([aviso({ id: 1, titulo: 'Uno' }), aviso({ id: 2, titulo: 'Dos' })]))
      .mockResolvedValueOnce(
        respuesta([aviso({ id: 1, titulo: 'Uno', leida: true }), aviso({ id: 2, titulo: 'Dos', leida: true })], 0),
      )
    api.marcarTodasNotificacionesLeidas.mockResolvedValue({ marcadas: 2 })

    montar()
    fireEvent.click(await screen.findByRole('button', { name: /marcar todas como leídas/i }))

    await waitFor(() => expect(api.marcarTodasNotificacionesLeidas).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByRole('button', { name: /marcar todas/i })).toBeNull())
  })

  it('muestra el error si la lista no carga', async () => {
    api.listaNotificaciones.mockRejectedValue(new Error('sin respuesta'))

    montar()

    expect(await screen.findByText(/no pudimos conectarnos/i)).toBeTruthy()
  })

  it('un fallo al cargar se explica, se puede reintentar y los avisos ya vistos no se reemplazan por el esqueleto', async () => {
    api.listaNotificaciones.mockRejectedValueOnce(new Error('sin respuesta')).mockResolvedValueOnce(respuesta([aviso({ id: 1, titulo: 'Uno' })]))

    montar()
    expect(await screen.findByText(/no pudimos conectarnos/i)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Uno')).toBeTruthy()
    expect(screen.queryByText(/no pudimos conectarnos/i)).toBeNull()
  })

  it('mientras carga muestra «Cargando notificaciones…» con un solo anuncio y no afirma que esté vacío', () => {
    api.listaNotificaciones.mockReturnValue(new Promise(() => {}))
    montar()
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByText('Cargando notificaciones…')).toBeTruthy()
    expect(screen.queryByText(/Estás al día|No tienes notificaciones/)).toBeNull()
  })

  it('quita la aclaración «(hora de Colombia)» del texto sin cambiar la hora', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso({ id: 1, titulo: 'Cita programada', tipo: 'citacion', url: '/mis-postulaciones?cita=4', mensaje: 'Tienes la entrevista: 30/11/2026 a las 10:30 (hora de Colombia).' })]))
    montar()
    expect(await screen.findByText('Tienes la entrevista: 30/11/2026 a las 10:30.')).toBeTruthy()
    expect(screen.getByText('Ver citación')).toBeTruthy()
  })
})
