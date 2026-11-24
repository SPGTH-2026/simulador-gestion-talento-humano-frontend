import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Notificaciones from './Notificaciones'
import * as api from '../../api/notificaciones'

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

function montar() {
  return render(
    <MemoryRouter initialEntries={['/notificaciones']}>
      <Routes>
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/mis-postulaciones" element={<p>Pantalla de postulaciones</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
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
    fireEvent.click(await screen.findByRole('button', { name: /debes corregir documentos \(sin leer\)/i }))

    expect(await screen.findByText('Pantalla de postulaciones')).toBeTruthy()
    expect(api.marcarNotificacionLeida).toHaveBeenCalledWith(7)
  })

  it('si un aviso no tiene destino, solo se marca como leído', async () => {
    api.listaNotificaciones.mockResolvedValue(respuesta([aviso({ id: 3, titulo: 'Aviso sin destino' })]))
    api.marcarNotificacionLeida.mockResolvedValue(aviso({ id: 3, titulo: 'Aviso sin destino', leida: true }))

    montar()
    fireEvent.click(await screen.findByRole('button', { name: /aviso sin destino \(sin leer\)/i }))

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
})
