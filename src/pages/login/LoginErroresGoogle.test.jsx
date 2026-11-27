import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ login: vi.fn() }) }))

import Login from './Login'

afterEach(cleanup)

describe('Login: errores de la vinculación con Google', () => {
  it.each([
    ['google_distinto', /vinculado a otra cuenta de Google/],
    ['correo_no_verificado', /Google no confirmó que ese correo es tuyo/],
    ['oauth_estado', /empezaste el inicio con Google desde este navegador/],
  ])('muestra el aviso de «%s» y deja a mano la recuperación del acceso', (codigo, mensaje) => {
    render(
      <MemoryRouter initialEntries={[`/login?error=${codigo}`]}>
        <Login />
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert').textContent).toMatch(mensaje)
    expect(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).getAttribute('href')).toBe('/recuperar')
  })
})
