import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AvisoCrearFicha from './AvisoCrearFicha'
import * as api from '../../api/fichas'

vi.mock('../../api/fichas', () => ({
  listaFichas: vi.fn(),
}))

function montar() {
  return render(
    <MemoryRouter>
      <AvisoCrearFicha />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Aviso para crear la ficha del instructor', () => {
  it('sin fichas invita a crearla, con un enlace a la sección Fichas', async () => {
    api.listaFichas.mockResolvedValue({ data: [] })

    montar()

    expect(await screen.findByText('Crea tu ficha para empezar')).toBeTruthy()
    expect(screen.getByRole('link', { name: /crear mi ficha/i }).getAttribute('href')).toBe('/fichas')
  })

  it('con alguna ficha no muestra nada', async () => {
    api.listaFichas.mockResolvedValue({ data: [{ id: 1, codigo: '3173334', nombre_programa: 'ADSO' }] })

    montar()

    await waitFor(() => expect(api.listaFichas).toHaveBeenCalled())
    expect(screen.queryByText('Crea tu ficha para empezar')).toBeNull()
  })

  it('si la consulta falla no muestra el aviso ni rompe la página', async () => {
    api.listaFichas.mockRejectedValue(new Error('sin respuesta'))

    const { container } = montar()

    await waitFor(() => expect(api.listaFichas).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })
})
