import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

let rol = 'super_admin'
let medida = { desborda: false, alFinal: true }
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { id: 1, role: rol } }) }))
vi.mock('../../hooks/useConfirmacion', () => ({ useConfirmacion: () => vi.fn().mockResolvedValue(true) }))
vi.mock('../../hooks/useDesbordeHorizontal', () => ({ default: () => ({ ref: { current: null }, alDesplazar: () => {}, ...medida }) }))
vi.mock('../../api/fichas', () => ({
  listaFichas: vi.fn(), crearFicha: vi.fn(), actualizarFicha: vi.fn(), eliminarFicha: vi.fn(), asignarInstructor: vi.fn(), quitarInstructor: vi.fn(),
}))
vi.mock('../../api/usuarios', () => ({ listaUsuarios: vi.fn().mockResolvedValue({ data: [], meta: { last_page: 1 } }) }))

import { listaFichas } from '../../api/fichas'
import FichasListado from './FichasListado'

const instructor = (id) => ({ id, name: `Instructor ${id}`, email: `i${id}@test.com` })
const ficha = (extra = {}) => ({
  id: 1, codigo: '3173334', nombre_programa: 'ADSO', estado: 'activa', creado_por: { id: 9, name: 'Dueña Demo', email: 'd@test.com' },
  instructores: [instructor(2)], convocatorias_count: 4, usuarios_count: 12, puede_gestionar: true, puede_asignar_instructores: true, ...extra,
})

const pintar = async (fichas) => {
  listaFichas.mockResolvedValue({ data: fichas })
  render(<FichasListado />)
  return screen.findByRole('table', { name: 'Fichas de formación' })
}

beforeEach(() => {
  rol = 'super_admin'
  medida = { desborda: false, alFinal: true }
})
afterEach(cleanup)

describe('Fichas: la tabla es la presentación principal', () => {
  it('tiene las siete columnas, el subtítulo del listado y ninguna tarjeta', async () => {
    const tabla = await pintar([ficha()])
    expect(within(tabla).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Ficha', 'Estado', 'Creada por', 'Convocatorias', 'Aspirantes y aprendices', 'Instructores', 'Acciones'])
    expect(screen.queryByRole('article')).toBeNull()
    expect(screen.getByText('Consulta y gestiona las fichas de formación a las que tienes acceso')).toBeTruthy()
  })

  it('sin desbordamiento no muestra el aviso de desplazamiento ni hace enfocable la región', async () => {
    await pintar([ficha()])
    expect(screen.queryByText('Desliza para ver más columnas')).toBeNull()
    expect(screen.getByRole('region', { name: /tabla desplazable/ }).getAttribute('tabindex')).toBeNull()
  })

  it('con desbordamiento muestra el aviso y la región se puede enfocar y desplazar con el teclado', async () => {
    medida = { desborda: true, alFinal: false }
    await pintar([ficha()])
    expect(screen.getByText('Desliza para ver más columnas')).toBeTruthy()
    expect(screen.getByRole('region', { name: /tabla desplazable/ }).getAttribute('tabindex')).toBe('0')
  })

  it('sin creador registrado dice «Sin registro» sin inventar un nombre', async () => {
    const tabla = await pintar([ficha({ creado_por: null })])
    expect(within(tabla).getByText('Sin registro')).toBeTruthy()
  })

  it('Instructores y Editar son botones de icono con nombre accesible que nombra la ficha y ayuda visible; Eliminar lleva texto', async () => {
    await pintar([ficha()])
    const instructores = screen.getByRole('button', { name: 'Instructores de la ficha 3173334' })
    expect(instructores.textContent).toBe('')
    expect(screen.getByRole('button', { name: 'Editar la ficha 3173334' }).textContent).toBe('')
    expect(screen.getAllByRole('tooltip', { hidden: true }).map((t) => t.textContent)).toEqual(['Instructores', 'Editar'])
    expect(screen.getByRole('button', { name: 'Eliminar la ficha 3173334' }).textContent).toBe('Eliminar')
  })

  it('quien solo consulta ve únicamente «Ver instructores»; sin instructores no ve ninguna acción', async () => {
    rol = 'instructor'
    await pintar([ficha({ puede_gestionar: false }), ficha({ id: 2, codigo: '9999999', puede_gestionar: false, instructores: [] })])
    expect(screen.getByRole('button', { name: 'Ver instructores de la ficha 3173334' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /9999999/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Editar|Eliminar/ })).toBeNull()
  })

  it('muestra una sola ayuda a la vez, con teclado y puntero, y la oculta al salir o con Escape', async () => {
    await pintar([ficha()])
    const instructores = screen.getByRole('button', { name: 'Instructores de la ficha 3173334' })
    const editar = screen.getByRole('button', { name: 'Editar la ficha 3173334' })
    const visibles = () => screen.getAllByRole('tooltip', { hidden: true }).filter((t) => t.getAttribute('aria-hidden') === 'false').map((t) => t.textContent)
    expect(visibles()).toEqual([])
    fireEvent.focus(editar)
    expect(visibles()).toEqual(['Editar'])
    fireEvent.pointerEnter(instructores.parentElement)
    expect(visibles()).toEqual(['Instructores'])
    fireEvent.pointerLeave(instructores.parentElement)
    expect(visibles()).toEqual([])
    fireEvent.focus(editar)
    fireEvent.keyDown(editar, { key: 'Escape' })
    expect(visibles()).toEqual([])
    fireEvent.focus(instructores)
    fireEvent.blur(instructores)
    expect(visibles()).toEqual([])
  })

  it('los nombres de instructores son texto normal, sin etiqueta con fondo', async () => {
    const tabla = await pintar([ficha({ instructores: [instructor(2), instructor(3), instructor(4)] })])
    const fila = within(tabla).getByRole('row', { name: /3173334/ })
    expect(within(fila).getByText('Instructor 2').className).not.toMatch(/bg-/)
    expect(within(fila).getByText('+1 más')).toBeTruthy()
  })
})
