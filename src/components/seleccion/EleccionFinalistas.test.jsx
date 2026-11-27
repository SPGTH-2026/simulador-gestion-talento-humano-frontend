import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EleccionFinalistas from './ranking/EleccionFinalistas'

afterEach(cleanup)

const ctx = (extra = {}) => ({
  abrirRevision: vi.fn(),
  aviso: null,
  avisoTransitorio: false,
  buscando: false,
  desactualizado: false,
  limpiar: vi.fn(),
  mensajeRef: { current: null },
  meta: { objetivo: { efectivo: 2 }, sugeridos: 2 },
  modo: 'con_actividades',
  pausaAviso: {},
  seleccion: new Set([1]),
  usarSugerencia: vi.fn(),
  ...extra,
})

const renderizar = (c) =>
  render(
    <MemoryRouter>
      <EleccionFinalistas {...c} />
    </MemoryRouter>,
  )

describe('EleccionFinalistas: orden visual = orden de teclado', () => {
  it('el código sigue el orden resumen → Vaciar → Elegir la sugerencia → Revisar y confirmar', () => {
    const { container } = renderizar(ctx())
    const botones = [...container.querySelectorAll('button')].map((b) => b.textContent.trim())
    expect(botones).toEqual(['Vaciar elección', 'Elegir la sugerencia', 'Revisar y confirmar'])
    // La acción principal va la última del grupo, sin reordenar con CSS.
    expect(container.innerHTML).not.toMatch(/(^|[\s"])(@min-\[\d+px\]:)?order-/)
  })

  it('sin actividades no ofrece la sugerencia y la principal sigue al final', () => {
    const { container } = renderizar(ctx({ modo: 'sin_actividades', meta: { objetivo: { efectivo: 2 }, sugeridos: 0 } }))
    const botones = [...container.querySelectorAll('button')].map((b) => b.textContent.trim())
    expect(botones).toEqual(['Vaciar elección', 'Revisar y confirmar'])
  })

  it('con la elección vacía deshabilita lo que no aplica y mantiene la sugerencia disponible', () => {
    renderizar(ctx({ seleccion: new Set() }))
    expect(screen.getByRole('button', { name: 'Vaciar elección' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Revisar y confirmar' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Elegir la sugerencia' }).disabled).toBe(false)
  })

  it('mientras busca la sugerencia la marca ocupada y bloquea las otras acciones', () => {
    renderizar(ctx({ buscando: true }))
    expect(screen.getByRole('button', { name: 'Buscando…' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Revisar y confirmar' }).disabled).toBe(true)
  })
})
