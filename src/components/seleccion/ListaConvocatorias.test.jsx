import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

vi.mock('../../api/seleccion', () => ({ listaConvocatoriasSeleccion: vi.fn() }))

import { listaConvocatoriasSeleccion } from '../../api/seleccion'
import ListaConvocatorias from './ListaConvocatorias'

afterEach(cleanup)

const fila = (id, nombre) => ({ id, nombre, codigo: `COD-${id}`, vacantes: 1, estado: { codigo: 'en_proceso', nombre: 'En proceso' }, candidatos: 3 })

describe('ListaConvocatorias', () => {
  it('las filas van dentro de una tarjeta con borde, y la elegida, las demás y el foco se distinguen', async () => {
    Element.prototype.scrollIntoView = vi.fn()
    listaConvocatoriasSeleccion.mockResolvedValue({
      data: [fila(1, 'Prueba Selección sin actividades'), fila(2, 'Prueba Selección con entrevista')],
      meta: { current_page: 1, last_page: 1, per_page: 20, total: 2 },
    })
    render(<ListaConvocatorias seleccionadaId="1" etiquetaSeleccionada="Prueba Selección sin actividades" onElegir={() => {}} />)

    const otra = await screen.findByRole('button', { name: /Prueba Selección con entrevista/ })
    const elegida = screen.getAllByRole('button', { name: /Prueba Selección sin actividades/ }).find((b) => b.getAttribute('aria-current'))
    const lista = otra.closest('ul')

    // Contenedor: mismo borde y superficie que las tarjetas del sistema (antes las filas flotaban sobre el fondo).
    expect(lista.className).toContain('border')
    expect(lista.className).toContain('bg-white')
    expect(lista.className).toContain('dark:bg-sena-superficie')
    // Margen interior para que el contorno del foco (2 px + 2 px de separación) no se recorte.
    expect(lista.className).toContain('p-1')

    // Elegida: relleno sólido y aria-current; las demás, sin relleno y con hover.
    expect(elegida.getAttribute('aria-current')).toBe('true')
    expect(elegida.className).toContain('bg-sena-oscuro')
    expect(otra.getAttribute('aria-current')).toBeNull()
    expect(otra.className).not.toContain('bg-sena-oscuro')
    expect(otra.className).toContain('hover:bg-sena-hundido')
    // Foco de teclado visible en todas las filas.
    expect(elegida.className).toContain('focus-visible:outline-2')
    expect(otra.className).toContain('focus-visible:outline-2')
  })
})
