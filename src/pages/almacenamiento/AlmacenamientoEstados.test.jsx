import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AlmacenamientoFicha from './AlmacenamientoFicha'
import Almacenamiento from './Almacenamiento'
import * as api from '../../api/almacenamiento'

const { confirmarMock, permisos } = vi.hoisted(() => ({
  confirmarMock: vi.fn(),
  permisos: { actuales: ['almacenamiento:ver', 'almacenamiento:gestionar'] },
}))

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ can: (permiso) => permisos.actuales.includes(permiso) }),
}))

vi.mock('../../api/almacenamiento', () => ({
  obtenerResumenAlmacenamiento: vi.fn(),
  listaDocumentosFicha: vi.fn(),
  borrarDocumentos: vi.fn(),
  listaIdsBorrablesFicha: vi.fn(),
}))

vi.mock('../../hooks/useConfirmacion', () => ({
  useConfirmacion: () => confirmarMock,
}))

const doc = (extra) => ({
  tipo: 'adicional',
  titulo: 'Diploma',
  obligatorio: false,
  borrable: true,
  aspirante: 'Ana',
  convocatoria: 'Auxiliar',
  tamano_bytes: 1024,
  creado_at: '2026-11-20T10:00:00+00:00',
  ...extra,
})

const listado = (documentos, meta = {}) => ({
  ficha: { id: 7, codigo: '3173334', nombre_programa: 'ADSO' },
  data: documentos,
  meta: { current_page: 1, last_page: 1, per_page: 20, total: documentos.length, ...meta },
})

function montarFicha() {
  return render(
    <MemoryRouter initialEntries={['/almacenamiento/fichas/7']}>
      <Routes>
        <Route path="/almacenamiento/fichas/:fichaId" element={<AlmacenamientoFicha />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  confirmarMock.mockResolvedValue(true)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Detalle de una ficha: estados y casos límite', () => {
  it('sin documentos muestra el estado vacío y no el botón de borrar como activo', async () => {
    api.listaDocumentosFicha.mockResolvedValue(listado([]))

    montarFicha()

    expect(await screen.findByText('Esta ficha no tiene documentos')).toBeTruthy()
  })

  it('el botón de borrar empieza deshabilitado cuando no hay nada marcado', async () => {
    api.listaDocumentosFicha.mockResolvedValue(listado([doc({ id: 1 })]))

    montarFicha()

    const boton = await screen.findByRole('button', { name: /borrar seleccionados/i })
    expect(boton.disabled).toBe(true)
  })

  it('«seleccionar todos» marca solo los que se pueden borrar, nunca los obligatorios', async () => {
    api.listaDocumentosFicha.mockResolvedValue(
      listado([
        doc({ id: 1, titulo: 'Hoja de vida', tipo: 'requerido', obligatorio: true, borrable: false }),
        doc({ id: 2, titulo: 'Diploma' }),
        doc({ id: 3, titulo: 'Certificado' }),
      ]),
    )

    montarFicha()
    fireEvent.click(await screen.findByRole('checkbox', { name: /seleccionar todos/i }))

    expect(screen.getByRole('checkbox', { name: /seleccionar diploma/i }).checked).toBe(true)
    expect(screen.getByRole('checkbox', { name: /seleccionar certificado/i }).checked).toBe(true)
    expect(screen.getByRole('checkbox', { name: /seleccionar hoja de vida/i }).checked).toBe(false)
    expect(screen.getByRole('button', { name: /borrar 2 seleccionado/i })).toBeTruthy()
  })

  it('cambiar de página vacía la selección: lo marcado en otra página no se borra por accidente', async () => {
    api.listaDocumentosFicha
      .mockResolvedValueOnce(listado([doc({ id: 1, titulo: 'Diploma' })], { last_page: 2, total: 21 }))
      .mockResolvedValueOnce(listado([doc({ id: 9, titulo: 'Otro' })], { current_page: 2, last_page: 2, total: 21 }))

    montarFicha()
    fireEvent.click(await screen.findByRole('checkbox', { name: /seleccionar diploma/i }))
    expect(screen.getByRole('button', { name: /borrar 1 seleccionado/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    await waitFor(() => expect(screen.getByRole('checkbox', { name: /seleccionar otro/i })).toBeTruthy())
    expect(screen.getByRole('button', { name: /borrar seleccionados/i }).disabled).toBe(true)
    expect(screen.getByRole('checkbox', { name: /seleccionar otro/i }).checked).toBe(false)
  })

  it('si la API rechaza el borrado, muestra el error y no quita la selección', async () => {
    api.listaDocumentosFicha.mockResolvedValue(listado([doc({ id: 2, titulo: 'Diploma' })]))
    api.borrarDocumentos.mockRejectedValue(new Error('sin respuesta'))

    montarFicha()
    fireEvent.click(await screen.findByRole('checkbox', { name: /seleccionar diploma/i }))
    fireEvent.click(screen.getByRole('button', { name: /borrar 1 seleccionado/i }))

    expect(await screen.findByText(/no pudimos conectarnos/i)).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /seleccionar diploma/i }).checked).toBe(true)
  })

  it('si el listado no carga, muestra el error y no el estado vacío', async () => {
    api.listaDocumentosFicha.mockRejectedValue(new Error('sin respuesta'))

    montarFicha()

    expect(await screen.findByText(/no pudimos conectarnos/i)).toBeTruthy()
    expect(screen.queryByText('Esta ficha no tiene documentos')).toBeNull()
  })

  it('no vuelve a pedir el borrado si ya hay uno en curso (doble clic)', async () => {
    let terminar
    api.listaDocumentosFicha.mockResolvedValue(listado([doc({ id: 2 })]))
    api.borrarDocumentos.mockReturnValue(new Promise((r) => { terminar = r }))

    montarFicha()
    fireEvent.click(await screen.findByRole('checkbox', { name: /seleccionar diploma/i }))
    fireEvent.click(screen.getByRole('button', { name: /borrar 1 seleccionado/i }))
    await waitFor(() => expect(api.borrarDocumentos).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: /borrar/i }))

    expect(api.borrarDocumentos).toHaveBeenCalledTimes(1)
    terminar({ borrados: [2], omitidos: [] })
  })
})

describe('Búsqueda, filtro y selección de todos los resultados', () => {
  it('escribir en el buscador pide la ficha con esa búsqueda', async () => {
    api.listaDocumentosFicha.mockResolvedValue(listado([doc({ id: 2 })]))

    montarFicha()
    await screen.findByRole('checkbox', { name: /seleccionar diploma/i })
    fireEvent.change(screen.getByPlaceholderText('Escribe para buscar…'), { target: { value: 'ana' } })

    await waitFor(() =>
      expect(api.listaDocumentosFicha).toHaveBeenLastCalledWith('7', expect.objectContaining({ q: 'ana', page: 1 })),
    )
  })

  it('el filtro de tipo pide solo adicionales', async () => {
    api.listaDocumentosFicha.mockResolvedValue(listado([doc({ id: 2 })]))

    montarFicha()
    await screen.findByRole('checkbox', { name: /seleccionar diploma/i })
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'adicional' } })

    await waitFor(() =>
      expect(api.listaDocumentosFicha).toHaveBeenLastCalledWith('7', expect.objectContaining({ tipo: 'adicional' })),
    )
  })

  it('«seleccionar todos los resultados» marca los que se pueden borrar de todas las páginas', async () => {
    api.listaDocumentosFicha.mockResolvedValue(listado([doc({ id: 2 })], { last_page: 3, total: 55 }))
    api.listaIdsBorrablesFicha.mockResolvedValue({ ids: [2, 9, 40, 51], total: 4 })

    montarFicha()
    fireEvent.click(await screen.findByRole('button', { name: /seleccionar todos los resultados/i }))

    expect(api.listaIdsBorrablesFicha).toHaveBeenCalledWith('7', {})
    expect(await screen.findByRole('button', { name: /borrar 4 seleccionado/i })).toBeTruthy()
  })

  it('la selección de todos los resultados respeta la búsqueda activa', async () => {
    api.listaDocumentosFicha.mockResolvedValue(listado([doc({ id: 2 })]))
    api.listaIdsBorrablesFicha.mockResolvedValue({ ids: [2], total: 1 })

    montarFicha()
    await screen.findByRole('checkbox', { name: /seleccionar diploma/i })
    fireEvent.change(screen.getByPlaceholderText('Escribe para buscar…'), { target: { value: 'luis' } })
    await waitFor(() => expect(api.listaDocumentosFicha).toHaveBeenLastCalledWith('7', expect.objectContaining({ q: 'luis' })))
    fireEvent.click(screen.getByRole('button', { name: /seleccionar todos los resultados/i }))

    await waitFor(() => expect(api.listaIdsBorrablesFicha).toHaveBeenCalledWith('7', { q: 'luis' }))
  })

  it('una búsqueda sin resultados lo dice con su propio mensaje', async () => {
    api.listaDocumentosFicha.mockResolvedValueOnce(listado([doc({ id: 2 })])).mockResolvedValue(listado([]))

    montarFicha()
    await screen.findByRole('checkbox', { name: /seleccionar diploma/i })
    fireEvent.change(screen.getByPlaceholderText('Escribe para buscar…'), { target: { value: 'nadie' } })

    expect(await screen.findByText('Ningún documento coincide')).toBeTruthy()
    expect(screen.queryByText('Esta ficha no tiene documentos')).toBeNull()
  })
})

describe('Aprendiz general: solo lectura', () => {
  beforeEach(() => {
    permisos.actuales = ['almacenamiento:ver']
  })

  afterEach(() => {
    permisos.actuales = ['almacenamiento:ver', 'almacenamiento:gestionar']
  })

  it('ve los documentos de su ficha sin casillas ni botón de borrar', async () => {
    api.listaDocumentosFicha.mockResolvedValue(listado([doc({ id: 2, titulo: 'Diploma' })]))

    montarFicha()

    expect(await screen.findByText('Diploma')).toBeTruthy()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByRole('button', { name: /borrar/i })).toBeNull()
    expect(screen.getByText(/solo lectura/i)).toBeTruthy()
  })
})

describe('Resumen de almacenamiento: estados y acciones', () => {
  it('el botón «Actualizar» vuelve a pedir el resumen', async () => {
    api.obtenerResumenAlmacenamiento.mockResolvedValue({ fichas: [], totales: { documentos: 0, bytes: 0 } })

    render(
      <MemoryRouter>
        <Almacenamiento />
      </MemoryRouter>,
    )

    await screen.findByText('No tienes fichas a cargo')
    fireEvent.click(screen.getByRole('button', { name: /actualizar/i }))

    await waitFor(() => expect(api.obtenerResumenAlmacenamiento).toHaveBeenCalledTimes(2))
  })

  it('una ficha sin medida (disco caído) no rompe la fila del total', async () => {
    api.obtenerResumenAlmacenamiento.mockResolvedValue({
      fichas: [{ ficha_id: 1, codigo: '3173334', nombre_programa: 'ADSO', documentos: 2, almacenamiento: { bytes: null, objetos: null } }],
      totales: { documentos: 2, bytes: 0 },
    })

    render(
      <MemoryRouter>
        <Almacenamiento />
      </MemoryRouter>,
    )

    expect(await screen.findByText('No disponible')).toBeTruthy()
    expect(screen.getByText('2 documento(s) registrados')).toBeTruthy()
  })
})
