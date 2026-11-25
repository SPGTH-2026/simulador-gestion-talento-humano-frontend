import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// La función está apagada por defecto: sin VITE_SEGURIDAD_CUENTA='true' no hay ruta, ni enlaces, ni la frase de la recuperación.
vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: null, authResolved: true, errorRed: '', can: () => false, logout: vi.fn(), cerrandoSesion: false }),
}))
vi.mock('../../components/notificaciones/CampanaNotificaciones', () => ({ default: () => null }))
vi.mock('../../api/auth', () => ({ forgotPassword: vi.fn(), resetPassword: vi.fn() }))

import Topbar from '../../components/Topbar'
import RecuperarContrasena from '../login/RecuperarContrasena'
import { seguridadCuentaActiva } from '../../config/seguridadCuenta'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.resetModules()
})
beforeEach(() => {
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }))
})

const enRuta = (ui) => render(<MemoryRouter initialEntries={['/recuperar']}>{ui}</MemoryRouter>)

describe('Seguridad de la cuenta: activación', () => {
  it.each([undefined, '', 'false', '1', 'TRUE', 'si'])('con la bandera %j está apagada', (valor) => {
    if (valor !== undefined) vi.stubEnv('VITE_SEGURIDAD_CUENTA', valor)
    expect(seguridadCuentaActiva()).toBe(false)
  })

  it('solo con exactamente «true» se enciende', () => {
    vi.stubEnv('VITE_SEGURIDAD_CUENTA', 'true')
    expect(seguridadCuentaActiva()).toBe(true)
  })

  it('apagada: la barra superior no ofrece el candado «Contraseña»', () => {
    enRuta(<Topbar onAbrirMenu={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Contraseña' })).toBeNull()
  })

  it.each([undefined, 'true'])('la recuperación pública usa la misma explicación breve con la bandera %j, sin nombrar Google ni métodos de ningún correo', (valor) => {
    if (valor) vi.stubEnv('VITE_SEGURIDAD_CUENTA', valor)
    enRuta(<RecuperarContrasena />)
    const frase = screen.getByText('Escribe tu correo y te enviaremos un código para que puedas elegir una nueva contraseña.')
    // Es el único recorrido para establecer o restablecer la contraseña: pide el correo y no revela nada de ninguna cuenta.
    expect(screen.getByRole('button', { name: /enviar código|Enviar/i })).toBeTruthy()
    expect(frase.textContent).not.toMatch(/Google|tu cuenta (tiene|usa)|vinculad/)
    expect(screen.queryByText(/te registraste con Google/)).toBeNull()
  })

  it('encendida: la barra superior abre «Contraseña» en un diálogo, sin salir de la página', () => {
    vi.stubEnv('VITE_SEGURIDAD_CUENTA', 'true')
    enRuta(<Topbar onAbrirMenu={() => {}} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Contraseña' }))
    expect(screen.getByRole('dialog', { name: 'Contraseña' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
