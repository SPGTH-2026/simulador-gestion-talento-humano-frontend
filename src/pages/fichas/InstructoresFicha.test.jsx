import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

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

import { asignarInstructor, listaFichas, quitarInstructor } from '../../api/fichas'
import { listaUsuarios } from '../../api/usuarios'
import FichasListado from './FichasListado'

const instructor = (id) => ({ id, name: `Instructor ${id}`, email: `i${id}@test.com` })
const ficha = (instructores) => ({
  id: 1, codigo: '3173334', nombre_programa: 'ADSO', estado: 'activa', creado_por: null, instructores, convocatorias_count: 0, usuarios_count: 0,
  puede_gestionar: true, puede_asignar_instructores: true,
})

const abrir = async (instructores = [instructor(2)]) => {
  listaFichas.mockResolvedValue({ data: [ficha(instructores)] })
  render(<FichasListado />)
  fireEvent.click(await screen.findByRole('button', { name: /^Instructores de la ficha/ }))
  return screen.findByRole('dialog', { name: /Instructores de la ficha 3173334/ })
}

beforeEach(() => {
  vi.clearAllMocks()
  listaUsuarios.mockResolvedValue({ data: [instructor(2), instructor(3), instructor(4)], meta: { last_page: 1 } })
  confirmar.mockResolvedValue(true)
})
afterEach(cleanup)

describe('Fichas: diálogo de instructores (super admin)', () => {
  it('avisa antes de quitar que cada instructor debe quedar en al menos una ficha', async () => {
    const dialogo = await abrir()
    expect(within(dialogo).getByText(/Cada instructor debe estar asignado al menos a una ficha\. Para quitarlo de esta, primero asígnalo a otra si es su única ficha\./)).toBeTruthy()
    expect(within(dialogo).getByRole('button', { name: 'Quitar a Instructor 2 de la ficha' }).disabled).toBe(false)
  })

  it('solo ofrece para asignar a los instructores que aún no están en la ficha', async () => {
    const dialogo = await abrir()
    const select = await within(dialogo).findByLabelText('Agregar instructor')
    const opciones = [...select.querySelectorAll('option')].map((o) => o.textContent)
    expect(opciones).toEqual(['Elige un instructor', 'Instructor 3', 'Instructor 4'])
    expect(within(dialogo).getByRole('button', { name: 'Asignar' }).disabled).toBe(true)
  })

  it('asigna al instructor elegido, con estado ocupado y sin duplicar la petición', async () => {
    let terminar
    asignarInstructor.mockImplementationOnce(() => new Promise((r) => { terminar = () => r({ data: ficha([instructor(2), instructor(3)]) }) }))
    const dialogo = await abrir()
    fireEvent.change(await within(dialogo).findByLabelText('Agregar instructor'), { target: { value: '3' } })
    const asignar = within(dialogo).getByRole('button', { name: 'Asignar' })
    fireEvent.click(asignar)
    fireEvent.click(asignar)
    expect(asignarInstructor).toHaveBeenCalledTimes(1)
    expect(asignarInstructor).toHaveBeenCalledWith(1, 3)
    expect(within(dialogo).getByRole('button', { name: 'Asignando…' }).getAttribute('aria-busy')).toBe('true')
    expect(within(dialogo).getByRole('button', { name: 'Cerrar' }).disabled).toBe(true)
    terminar()
    expect(await within(dialogo).findByText('Instructor asignado a la ficha.')).toBeTruthy()
    expect(within(dialogo).getByText('2 instructores asignados')).toBeTruthy()
  })

  it('quita al instructor tras confirmar y actualiza la lista', async () => {
    quitarInstructor.mockResolvedValueOnce({ data: ficha([instructor(2)]) })
    const dialogo = await abrir([instructor(2), instructor(3)])
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Quitar a Instructor 3 de la ficha' }))
    expect(await within(dialogo).findByText('Instructor quitado de la ficha.')).toBeTruthy()
    expect(quitarInstructor).toHaveBeenCalledWith(1, 3)
    expect(within(dialogo).getByText('1 instructor asignado')).toBeTruthy()
  })

  it('si se cancela la confirmación no se quita a nadie', async () => {
    confirmar.mockResolvedValueOnce(false)
    const dialogo = await abrir([instructor(2), instructor(3)])
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Quitar a Instructor 3 de la ficha' }))
    await waitFor(() => expect(confirmar).toHaveBeenCalled())
    expect(quitarInstructor).not.toHaveBeenCalled()
    expect(within(dialogo).getByText('2 instructores asignados')).toBeTruthy()
  })

  it('muestra la regla del backend que impide dejar a un instructor sin ficha', async () => {
    const regla = 'El instructor debe quedar en al menos una ficha: asígnale otra antes de quitarlo de esta.'
    quitarInstructor.mockRejectedValueOnce({ response: { status: 422, data: { message: regla, errors: { usuario_id: [regla] } }, headers: {} } })
    const dialogo = await abrir()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Quitar a Instructor 2 de la ficha' }))
    expect(await within(dialogo).findByText(regla)).toBeTruthy()
    expect(within(dialogo).getByText('1 instructor asignado')).toBeTruthy()
  })

  it('un fallo al cargar los instructores se muestra con un botón para reintentar', async () => {
    listaUsuarios.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Falló' }, headers: {} } })
    const dialogo = await abrir()
    expect(await within(dialogo).findByText(/No pudimos cargar los instructores/)).toBeTruthy()
    expect(within(dialogo).queryByLabelText('Agregar instructor')).toBeNull()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Reintentar' }))
    expect(await within(dialogo).findByLabelText('Agregar instructor')).toBeTruthy()
    expect(listaUsuarios).toHaveBeenCalledTimes(2)
  })
})
