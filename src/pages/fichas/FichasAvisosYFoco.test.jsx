import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const confirmar = vi.fn()
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { id: 1, role: 'super_admin' } }) }))
vi.mock('../../hooks/useConfirmacion', () => ({ useConfirmacion: () => confirmar }))
vi.mock('../../api/fichas', () => ({
  listaFichas: vi.fn(),
  crearFicha: vi.fn(),
  actualizarFicha: vi.fn(),
  eliminarFicha: vi.fn(),
  asignarInstructor: vi.fn(),
  quitarInstructor: vi.fn(),
}))
vi.mock('../../api/usuarios', () => ({ listaUsuarios: vi.fn() }))

import { actualizarFicha, asignarInstructor, crearFicha, eliminarFicha, listaFichas } from '../../api/fichas'
import { listaUsuarios } from '../../api/usuarios'
import FichasListado from './FichasListado'

const instructor = (id) => ({ id, name: `Instructor ${id}`, email: `i${id}@test.com` })
const ficha = (extra = {}) => ({
  id: 1, codigo: '3173334', nombre_programa: 'ADSO', estado: 'activa', creado_por: null, instructores: [instructor(2)], convocatorias_count: 0,
  usuarios_count: 0, puede_gestionar: true, puede_asignar_instructores: true, ...extra,
})
const falla = (status, message, errors) => ({ response: { status, data: { message, ...(errors ? { errors } : {}) }, headers: {} } })
const SEIS_SEGUNDOS = 6100

const pintar = async (fichas = [ficha()]) => {
  listaFichas.mockResolvedValue({ data: fichas })
  render(<FichasListado />)
  await screen.findByRole('table')
}

beforeEach(() => {
  vi.clearAllMocks()
  listaUsuarios.mockResolvedValue({ data: [instructor(2), instructor(3)], meta: { last_page: 1 } })
  confirmar.mockResolvedValue(true)
})
afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

describe('Fichas: avisos, errores y foco', () => {
  it('el aviso de éxito se retira solo a los 6 segundos y el de error se queda', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    eliminarFicha.mockResolvedValueOnce({ data: { id: 1, eliminada: true } })
    await pintar([ficha(), ficha({ id: 2, codigo: '9999999' })])
    fireEvent.click(within(screen.getByRole('row', { name: /3173334/ })).getByRole('button', { name: /^Eliminar/ }))
    expect(await screen.findByText('Ficha eliminada correctamente.')).toBeTruthy()
    await act(async () => { await vi.advanceTimersByTimeAsync(SEIS_SEGUNDOS) })
    expect(screen.queryByText('Ficha eliminada correctamente.')).toBeNull()

    eliminarFicha.mockRejectedValueOnce(falla(422, 'No se puede eliminar una ficha que tiene personas asignadas.', { ficha: ['No se puede eliminar una ficha que tiene personas asignadas.'] }))
    fireEvent.click(screen.getByRole('button', { name: /^Eliminar/ }))
    expect(await screen.findByText(/tiene personas asignadas/)).toBeTruthy()
    await act(async () => { await vi.advanceTimersByTimeAsync(SEIS_SEGUNDOS * 3) })
    expect(screen.getByText(/tiene personas asignadas/)).toBeTruthy()
  })

  it('al eliminar, el foco pasa al título de la página (el botón desaparece con su tarjeta)', async () => {
    eliminarFicha.mockResolvedValueOnce({ data: { id: 1, eliminada: true } })
    await pintar([ficha(), ficha({ id: 2, codigo: '9999999' })])
    fireEvent.click(within(screen.getByRole('row', { name: /3173334/ })).getByRole('button', { name: /^Eliminar/ }))
    await screen.findByText('Ficha eliminada correctamente.')
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Fichas' })))
  })

  it('un error de campo se ve una sola vez y uno general sigue mostrándose, con el foco de vuelta en el botón', async () => {
    await pintar()
    fireEvent.click(screen.getByRole('button', { name: 'Nueva ficha' }))
    let dialogo = await screen.findByRole('dialog', { name: 'Nueva ficha' })
    crearFicha.mockRejectedValueOnce(falla(422, 'Ya existe una ficha con este código.', { codigo: ['Ya existe una ficha con este código.'] }))
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear ficha' }))
    await within(dialogo).findByText('Ya existe una ficha con este código.')
    expect(within(dialogo).getAllByText('Ya existe una ficha con este código.')).toHaveLength(1)
    expect(document.activeElement).toBe(within(dialogo).getByLabelText(/Código/))

    crearFicha.mockRejectedValueOnce(falla(403, 'No tienes permiso para crear fichas.'))
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear ficha' }))
    expect(await within(dialogo).findByText('No tienes permiso para crear fichas.')).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(within(dialogo).getByRole('button', { name: 'Crear ficha' })))
    dialogo = screen.getByRole('dialog')
    expect(within(dialogo).getByLabelText(/Código/).value).toBe('')
  })

  it('Escape cierra el diálogo de edición sin petición y devuelve el foco al botón Editar', async () => {
    await pintar()
    const editar = screen.getByRole('button', { name: /^Editar/ })
    editar.focus()
    fireEvent.click(editar)
    await screen.findByRole('dialog', { name: 'Editar ficha' })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(actualizarFicha).not.toHaveBeenCalled()
    await waitFor(() => expect(document.activeElement).toBe(editar))
  })

  it('Escape en el diálogo de instructores cierra sin peticiones y devuelve el foco al botón', async () => {
    await pintar()
    const abrir = screen.getByRole('button', { name: /^Instructores de la ficha/ })
    abrir.focus()
    fireEvent.click(abrir)
    await screen.findByRole('dialog', { name: /Instructores de la ficha/ })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(asignarInstructor).not.toHaveBeenCalled()
    await waitFor(() => expect(document.activeElement).toBe(abrir))
  })

  it('en instructores, el éxito se retira solo y el foco pasa al resumen de la lista', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    asignarInstructor.mockResolvedValueOnce({ data: ficha({ instructores: [instructor(2), instructor(3)] }) })
    await pintar()
    fireEvent.click(screen.getByRole('button', { name: /^Instructores de la ficha/ }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(await within(dialogo).findByLabelText('Agregar instructor'), { target: { value: '3' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Asignar' }))
    expect(await within(dialogo).findByText('Instructor asignado a la ficha.')).toBeTruthy()
    expect(document.activeElement).toBe(within(dialogo).getByText('2 instructores asignados'))
    await act(async () => { await vi.advanceTimersByTimeAsync(SEIS_SEGUNDOS) })
    expect(within(dialogo).queryByText('Instructor asignado a la ficha.')).toBeNull()
  })
})
