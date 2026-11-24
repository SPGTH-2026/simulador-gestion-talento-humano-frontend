import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import FiltrosConvocatorias from './FiltrosConvocatorias'

afterEach(cleanup)

// Distribución según el perfil: Buscar + Ficha en la primera fila, Estado/Tipo/Modalidad/Ordenar en la segunda.
const base = {
  fichas: [{ id: 1, codigo: '2896411', nombre_programa: 'Análisis y desarrollo de software con un nombre de programa bastante largo' }],
  filtroEstado: '', filtroFicha: '', filtroModalidad: '', filtroTipo: '', gestionaEstricto: true,
  opcionesEstado: [{ codigo: 'publicada', nombre: 'Publicada' }], opcionesModalidad: [{ codigo: 'presencial', nombre: 'Presencial' }],
  opcionesTipo: [{ codigo: 'externo', nombre: 'Externo' }], orden: 'reciente', puedeFiltrarFicha: true, reemplazar: true,
  setTermino: () => {}, setValores: vi.fn(), termino: '',
}
const filas = (contenedor) => [...contenedor.querySelectorAll('[role=search] > div')]

describe('FiltrosConvocatorias: distribución', () => {
  it('con Ficha: Buscar y Ficha comparten la primera fila y los cuatro filtros van en la segunda', () => {
    const { container } = render(<FiltrosConvocatorias ctx={base} />)
    const [fila1, fila2] = filas(container)

    expect(fila1.className).toContain('@min-[640px]:grid-cols-[minmax(0,1fr)_minmax(15rem,24rem)]')
    expect(fila1.contains(screen.getByLabelText('Buscar por nombre, código o cargo'))).toBe(true)
    expect(fila1.contains(screen.getByLabelText('Ficha'))).toBe(true)
    for (const etiqueta of ['Estado', 'Tipo', 'Modalidad', 'Ordenar por']) expect(fila2.contains(screen.getByLabelText(etiqueta))).toBe(true)
    expect(fila2.className).toContain('@min-[860px]:grid-cols-4')
  })

  it('sin Ficha, Buscar ocupa toda la primera fila', () => {
    const { container } = render(<FiltrosConvocatorias ctx={{ ...base, puedeFiltrarFicha: false }} />)
    const [fila1] = filas(container)

    expect(fila1.className).not.toContain('grid-cols-[')
    expect(screen.queryByLabelText('Ficha')).toBeNull()
    expect(fila1.children).toHaveLength(1)
  })

  it('con los permisos que ocultan Estado, la segunda fila reparte tres filtros', () => {
    const { container } = render(<FiltrosConvocatorias ctx={{ ...base, gestionaEstricto: false }} />)
    const [, fila2] = filas(container)

    expect(screen.queryByLabelText('Estado')).toBeNull()
    expect(fila2.className).toContain('@min-[860px]:grid-cols-3')
    expect(screen.getByLabelText('Buscar por nombre o cargo')).toBeTruthy()
  })

  it('cada filtro sigue escribiendo su parámetro y reinicia la página', () => {
    const setValores = vi.fn()
    render(<FiltrosConvocatorias ctx={{ ...base, setValores }} />)

    fireEvent.change(screen.getByLabelText('Ficha'), { target: { value: '1' } })
    expect(setValores).toHaveBeenLastCalledWith({ ficha: '1', page: '' }, { reemplazar: true })
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'publicada' } })
    expect(setValores).toHaveBeenLastCalledWith({ estado: 'publicada', page: '' }, { reemplazar: true })
  })
})
