import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Información conocida durante la carga: título, buscador y encabezados de la tabla permanecen; solo las filas son esqueleto, el
// total no se inventa y la línea de carga es una sola.
vi.mock('../../api/fichas', () => ({ listaFichas: vi.fn() }))
vi.mock('../../api/portafolios', () => ({ listaAspirantes: vi.fn() }))
import { listaFichas } from '../../api/fichas'
import { listaAspirantes } from '../../api/portafolios'
import DocumentosListado from './DocumentosListado'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  listaFichas.mockResolvedValue({ data: [] })
})

describe('Portafolios: carga inicial', () => {
  it('muestra título, encabezados conocidos y una sola línea de carga, sin inventar el total', async () => {
    let resolver
    listaAspirantes.mockReturnValue(new Promise((r) => { resolver = r }))
    render(<MemoryRouter><DocumentosListado /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Portafolios Documentales' })).toBeTruthy()
    expect(screen.getByText('Aspirante')).toBeTruthy()
    expect(screen.getByText('Acciones')).toBeTruthy()
    expect(screen.queryByText(/aspirante\(s\) con postulaciones/)).toBeNull()
    expect(screen.getAllByText('Cargando aspirantes…').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('status')).toHaveLength(1)

    await act(async () => resolver({ data: [], meta: { total: 0, current_page: 1, last_page: 1, per_page: 20 } }))
    expect(await screen.findByText('Sin aspirantes')).toBeTruthy()
    expect(screen.getByText('0 aspirante(s) con postulaciones')).toBeTruthy()
  })
})
