import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

let usuario
const confirmar = vi.fn()
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: usuario }) }))
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

import { actualizarFicha, crearFicha, eliminarFicha, listaFichas } from '../../api/fichas'
import { listaUsuarios } from '../../api/usuarios'
import FichasListado from './FichasListado'

const instructor = (id) => ({ id, name: `Instructor ${id}`, email: `i${id}@test.com` })
const ficha = (extra = {}) => ({
  id: 1, codigo: '3173334', nombre_programa: 'Análisis y Desarrollo de Software', estado: 'activa', creado_por: { id: 9, name: 'Dueña Demo', email: 'd@test.com' },
  instructores: [instructor(2)], convocatorias_count: 4, usuarios_count: 12, puede_gestionar: true, puede_asignar_instructores: true, ...extra,
})
const error422 = (campo, mensaje) => ({ response: { status: 422, data: { message: mensaje, errors: { [campo]: [mensaje] } }, headers: {} } })

const pintar = async (fichas = [ficha()], rol = 'super_admin') => {
  usuario = { id: 1, role: rol }
  listaFichas.mockResolvedValue({ data: fichas })
  render(<FichasListado />)
  await screen.findByRole('heading', { level: 1, name: 'Fichas' })
  if (fichas.length > 0) await screen.findByRole('table')
}

beforeEach(() => {
  vi.clearAllMocks()
  listaUsuarios.mockResolvedValue({ data: [instructor(2), instructor(3), instructor(4)], meta: { last_page: 1 } })
  confirmar.mockResolvedValue(true)
})
afterEach(cleanup)

describe('Fichas: presentación y permisos', () => {
  it('cada ficha muestra código, programa, estado, creador y actividad', async () => {
    await pintar()
    const tarjeta = screen.getByRole('row', { name: /3173334/ })
    expect(within(tarjeta).getByText('Análisis y Desarrollo de Software')).toBeTruthy()
    expect(within(tarjeta).getByText('Activa')).toBeTruthy()
    expect(within(tarjeta).getByText('Dueña Demo')).toBeTruthy()
    expect(within(tarjeta).getAllByRole('cell').map((c) => c.textContent).slice(2, 4)).toEqual(['4', '12'])
  })

  it('el super admin ve Gestionar instructores, Editar y Eliminar', async () => {
    await pintar()
    expect(screen.getByRole('button', { name: /^Instructores de la ficha/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Editar/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Eliminar/ })).toBeTruthy()
  })

  it('un instructor con acceso sin ser dueño no ve Editar ni Eliminar y solo consulta los instructores', async () => {
    await pintar([ficha({ puede_gestionar: false, puede_asignar_instructores: false })], 'instructor')
    expect(screen.queryByRole('button', { name: /^Editar/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Eliminar/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Instructores de la ficha/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Ver instructores/ }))
    const dialogo = await screen.findByRole('dialog', { name: /Instructores de la ficha 3173334/ })
    expect(within(dialogo).getByText('Instructor 2')).toBeTruthy()
    expect(within(dialogo).queryByRole('button', { name: /Quitar/ })).toBeNull()
    expect(within(dialogo).queryByRole('button', { name: 'Asignar' })).toBeNull()
    expect(listaUsuarios).not.toHaveBeenCalled()
  })

  it('un instructor dueño ve Editar y Eliminar pero no gestiona instructores', async () => {
    await pintar([ficha({ puede_gestionar: true, puede_asignar_instructores: false })], 'instructor')
    expect(screen.getByRole('button', { name: /^Editar/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Eliminar/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Instructores de la ficha/ })).toBeNull()
  })

  it('con muchos instructores la tarjeta muestra un resumen y el diálogo la lista completa', async () => {
    await pintar([ficha({ instructores: [1, 2, 3, 4, 5].map(instructor) })], 'instructor')
    const fila = screen.getByRole('row', { name: /3173334/ })
    expect(within(fila).getAllByRole('listitem')).toHaveLength(3) // 2 nombres + «+3 más»
    expect(within(fila).getByText('+3 más')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^Ver instructores/ }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByText('5 instructores asignados')).toBeTruthy()
    expect(within(dialogo).getByText('Instructor 5')).toBeTruthy()
  })

  it('sin fichas muestra el estado vacío de siempre y con un fallo de carga, el error', async () => {
    await pintar([])
    expect(screen.getByText('No hay fichas registradas.')).toBeTruthy()
    cleanup()
    listaFichas.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Falló' }, headers: {} } })
    render(<FichasListado />)
    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})

describe('Fichas: crear y editar en el diálogo', () => {
  const abrirAlta = async () => {
    await pintar()
    fireEvent.click(screen.getByRole('button', { name: 'Nueva ficha' }))
    return screen.findByRole('dialog', { name: 'Nueva ficha' })
  }
  const escribir = (el, valor) => fireEvent.change(el, { target: { value: valor } })

  it('un error del servidor aparece junto al campo y conserva lo escrito', async () => {
    crearFicha.mockRejectedValueOnce(error422('codigo', 'Ya existe una ficha con este código.'))
    const dialogo = await abrirAlta()
    escribir(within(dialogo).getByLabelText(/Código/), '3173334')
    escribir(within(dialogo).getByLabelText(/Programa/), 'Otro programa')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear ficha' }))

    expect(await within(dialogo).findByText('Ya existe una ficha con este código.')).toBeTruthy()
    expect(within(dialogo).getByLabelText(/Código/).value).toBe('3173334')
    expect(within(dialogo).getByLabelText(/Programa/).value).toBe('Otro programa')
    expect(within(dialogo).getByLabelText(/Código/).getAttribute('aria-invalid')).toBe('true')
  })

  it('crea la ficha, cierra el diálogo, avisa y devuelve el foco al botón que lo abrió', async () => {
    crearFicha.mockResolvedValueOnce({ data: ficha({ id: 5, codigo: '4000000' }) })
    const abrir = (await pintar(), screen.getByRole('button', { name: 'Nueva ficha' }))
    abrir.focus()
    fireEvent.click(abrir)
    const dialogo = await screen.findByRole('dialog', { name: 'Nueva ficha' })
    escribir(within(dialogo).getByLabelText(/Código/), '4000000')
    escribir(within(dialogo).getByLabelText(/Programa/), 'Programa nuevo')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear ficha' }))

    expect(await screen.findByText('Ficha creada correctamente. Ya eres su dueño.')).toBeTruthy()
    expect(crearFicha).toHaveBeenCalledWith({ codigo: '4000000', nombre_programa: 'Programa nuevo', estado: 'activa' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('row', { name: /4000000/ })).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(abrir))
  })

  it('protege contra el doble envío y no se cierra mientras guarda', async () => {
    let terminar
    crearFicha.mockImplementationOnce(() => new Promise((r) => { terminar = () => r({ data: ficha({ id: 6, codigo: '5' }) }) }))
    const dialogo = await abrirAlta()
    escribir(within(dialogo).getByLabelText(/Código/), '5')
    escribir(within(dialogo).getByLabelText(/Programa/), 'P')
    const enviar = within(dialogo).getByRole('button', { name: 'Crear ficha' })
    fireEvent.click(enviar)
    fireEvent.click(enviar)
    fireEvent.submit(dialogo.querySelector('form'))
    expect(crearFicha).toHaveBeenCalledTimes(1)
    expect(within(dialogo).getByRole('button', { name: 'Guardando…' }).getAttribute('aria-busy')).toBe('true')
    expect(within(dialogo).getByRole('button', { name: 'Cerrar' }).disabled).toBe(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeTruthy()
    terminar()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('cerrar con la X no guarda nada', async () => {
    const dialogo = await abrirAlta()
    escribir(within(dialogo).getByLabelText(/Código/), '777')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(crearFicha).not.toHaveBeenCalled()
    expect(actualizarFicha).not.toHaveBeenCalled()
  })

  it('editar parte de los datos de la ficha y los envía igual que antes', async () => {
    actualizarFicha.mockResolvedValueOnce({ data: ficha({ estado: 'cerrada' }) })
    await pintar()
    fireEvent.click(screen.getByRole('button', { name: /^Editar/ }))
    const dialogo = await screen.findByRole('dialog', { name: 'Editar ficha' })
    expect(within(dialogo).getByLabelText(/Código/).value).toBe('3173334')
    fireEvent.change(within(dialogo).getByLabelText('Estado'), { target: { value: 'cerrada' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Ficha actualizada correctamente.')).toBeTruthy()
    expect(actualizarFicha).toHaveBeenCalledWith(1, { codigo: '3173334', nombre_programa: 'Análisis y Desarrollo de Software', estado: 'cerrada' })
  })
})

describe('Fichas: eliminar', () => {
  it('no elimina si se cancela la confirmación', async () => {
    confirmar.mockResolvedValueOnce(false)
    await pintar()
    fireEvent.click(screen.getByRole('button', { name: /^Eliminar/ }))
    await waitFor(() => expect(confirmar).toHaveBeenCalled())
    expect(eliminarFicha).not.toHaveBeenCalled()
  })

  it('elimina una vez aunque se pulse varias, con estado ocupado, y la quita de la lista', async () => {
    let terminar
    eliminarFicha.mockImplementationOnce(() => new Promise((r) => { terminar = () => r({ data: { id: 1, eliminada: true } }) }))
    await pintar()
    const boton = screen.getByRole('button', { name: /^Eliminar/ })
    fireEvent.click(boton)
    await screen.findByRole('button', { name: /Eliminando/ })
    fireEvent.click(screen.getByRole('button', { name: /Eliminando/ }))
    expect(eliminarFicha).toHaveBeenCalledTimes(1)
    terminar()
    expect(await screen.findByText('Ficha eliminada correctamente.')).toBeTruthy()
    expect(screen.queryByRole('row', { name: /3173334/ })).toBeNull()
  })

  it('muestra el mensaje del servidor cuando no se puede eliminar', async () => {
    eliminarFicha.mockRejectedValueOnce(error422('ficha', 'No se puede eliminar una ficha que tiene convocatorias.'))
    await pintar()
    fireEvent.click(screen.getByRole('button', { name: /^Eliminar/ }))
    expect(await screen.findByText(/tiene convocatorias/)).toBeTruthy()
    expect(screen.getByRole('row', { name: /3173334/ })).toBeTruthy()
  })
})
