import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const estado = vi.hoisted(() => ({ valor: {} }))
vi.mock('../auth/useAuth', () => ({ useAuth: () => estado.valor }))

import AuthLayout from './AuthLayout'

function App({ entrada }) {
  return (
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<p>pantalla de login</p>} />
        </Route>
        <Route path="/convocatorias" element={<p>listado de convocatorias</p>} />
        <Route path="/" element={<p>portada</p>} />
        <Route path="/verificar-correo" element={<p>verificar correo</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AuthLayout', () => {
  it('con sesión, vuelve a la ruta que se quería abrir antes del login', () => {
    estado.valor = { user: { email_verified: true }, authResolved: true, errorRed: null }
    render(
      <App
        entrada={{ pathname: '/login', state: { from: { pathname: '/convocatorias', search: '' } } }}
      />,
    )
    expect(screen.getByText('listado de convocatorias')).toBeTruthy()
  })

  it('con sesión y sin ruta previa, va a la portada', () => {
    estado.valor = { user: { email_verified: true }, authResolved: true, errorRed: null }
    render(<App entrada="/login" />)
    expect(screen.getByText('portada')).toBeTruthy()
  })

  it('con correo sin verificar, manda a verificarlo', () => {
    estado.valor = { user: { email_verified: false }, authResolved: true, errorRed: null }
    render(<App entrada="/login" />)
    expect(screen.getByText('verificar correo')).toBeTruthy()
  })
})
