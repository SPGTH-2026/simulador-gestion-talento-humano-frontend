import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Comportamiento del marco autenticado en móvil: el menú, la navegación y el foco no deben dejar capas, 'inert' ni mover el documento.
vi.mock('../auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin', role: 'super_admin', ficha: null },
    can: () => true,
    logout: vi.fn(),
    cerrandoSesion: false,
  }),
}))
vi.mock('../components/notificaciones/CampanaNotificaciones', () => ({ default: () => null }))

import AppLayout from './AppLayout'

let llamadasFoco
beforeEach(() => {
  llamadasFoco = []
  const original = HTMLElement.prototype.focus
  vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (opciones) {
    llamadasFoco.push({ id: this.id || this.getAttribute('aria-label') || this.tagName, opciones })
    return original.call(this, opciones)
  })
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }))
})
afterEach(() => {
  vi.restoreAllMocks()
  cleanup()
})

const montar = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<p>Inicio de prueba</p>} />
          <Route path="/usuarios" element={<p>Usuarios de prueba</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

const envoltorio = () => document.getElementById('contenido').parentElement

describe('AppLayout en móvil', () => {
  it('el marco usa la altura visible con respaldo y el contenido es el único con desplazamiento propio', () => {
    montar()
    const marco = envoltorio().parentElement
    expect(marco.className).toContain('alto-marco')
    expect(marco.className).toContain('overflow-hidden')
    // El contenido puede encogerse dentro del marco (sin min-h-0 desbordaría y movería el documento).
    expect(envoltorio().className).toContain('min-h-0')
    expect(document.getElementById('contenido').className).toContain('min-h-0')
    expect(document.getElementById('contenido').className).toContain('overflow-y-auto')
  })

  it('abrir el menú bloquea el resto y cerrarlo (botón, fondo o Escape) lo libera y devuelve el foco sin mover la página', async () => {
    montar()
    const abrir = screen.getByRole('button', { name: 'Abrir menú' })
    for (const cerrar of [
      () => fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' })),
      () => fireEvent.click(document.querySelector('div.fixed.inset-0.z-30')),
      () => fireEvent.keyDown(document, { key: 'Escape' }),
    ]) {
      fireEvent.click(abrir)
      expect(envoltorio().hasAttribute('inert')).toBe(true)
      llamadasFoco.length = 0
      cerrar()
      await waitFor(() => expect(envoltorio().hasAttribute('inert')).toBe(false))
      await waitFor(() => expect(document.activeElement).toBe(abrir))
      expect(llamadasFoco.find((l) => l.id === 'Abrir menú')?.opciones).toEqual({ preventScroll: true })
    }
  })

  it('navegar desde el menú lo cierra, no deja inert y enfoca el contenido sin desplazar el documento', async () => {
    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    llamadasFoco.length = 0
    fireEvent.click(screen.getByRole('link', { name: /Usuarios/ }))
    expect(await screen.findByText('Usuarios de prueba')).toBeTruthy()
    await waitFor(() => expect(envoltorio().hasAttribute('inert')).toBe(false))
    await waitFor(() => expect(document.activeElement).toBe(document.getElementById('contenido')))
    expect(llamadasFoco.find((l) => l.id === 'contenido')?.opciones).toEqual({ preventScroll: true })
    // Repetir: abrir y navegar de nuevo no acumula bloqueos.
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    fireEvent.click(screen.getAllByRole('link', { name: /Inicio/ })[0])
    expect(await screen.findByText('Inicio de prueba')).toBeTruthy()
    await waitFor(() => expect(envoltorio().hasAttribute('inert')).toBe(false))
  })

  it('al cambiar de pantalla el contenido vuelve arriba y no conserva la posición de la anterior', async () => {
    montar()
    const contenido = document.getElementById('contenido')
    contenido.scrollTop = 300 // jsdom guarda el valor asignado
    expect(contenido.scrollTop).toBe(300)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    fireEvent.click(screen.getByRole('link', { name: /Usuarios/ }))
    expect(await screen.findByText('Usuarios de prueba')).toBeTruthy()
    await waitFor(() => expect(document.getElementById('contenido').scrollTop).toBe(0))
  })

  it('el fondo del menú cerrado no captura toques', () => {
    montar()
    const fondo = document.querySelector('div.fixed.inset-0.z-30')
    expect(fondo.className).toContain('pointer-events-none')
  })

  it('al desmontar el marco se retiran sus escuchas del documento', () => {
    const quitar = vi.spyOn(document, 'removeEventListener')
    const { unmount } = montar()
    unmount()
    expect(quitar.mock.calls.some(([tipo]) => tipo === 'focusout')).toBe(true)
  })
})
