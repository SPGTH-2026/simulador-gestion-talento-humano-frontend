import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Almacenamiento from './Almacenamiento'
import * as api from '../../api/almacenamiento'

vi.mock('../../api/almacenamiento', () => ({
  obtenerResumenAlmacenamiento: vi.fn(),
  listaDocumentosFicha: vi.fn(),
  borrarDocumentos: vi.fn(),
}))

const ficha = (extra) => ({
  ficha_id: 1,
  codigo: '3173334',
  nombre_programa: 'ADSO',
  documentos: 4,
  almacenamiento: { bytes: 2048, objetos: 3 },
  ...extra,
})

function montar() {
  return render(
    <MemoryRouter>
      <Almacenamiento />
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('Página de almacenamiento', () => {
  it('muestra la base de datos solo cuando el servidor la envía (super admin)', async () => {
    api.obtenerResumenAlmacenamiento.mockResolvedValue({
      fichas: [ficha()],
      totales: { documentos: 4, bytes: 2048 },
      base: { motor: 'pgsql', bytes: 5 * 1024 * 1024 },
    })

    montar()

    expect(await screen.findByText('Base de datos')).toBeTruthy()
    expect(screen.getByText('5,0 MB')).toBeTruthy()
    expect(screen.getByText('PostgreSQL (Supabase)')).toBeTruthy()
    expect(screen.getByText('Documentos de todas las fichas')).toBeTruthy()
  })

  it('no muestra la base de datos al instructor', async () => {
    api.obtenerResumenAlmacenamiento.mockResolvedValue({
      fichas: [ficha()],
      totales: { documentos: 4, bytes: 2048 },
    })

    montar()

    expect(await screen.findByText('Documentos de tus fichas')).toBeTruthy()
    expect(screen.queryByText('Documentos de todas las fichas')).toBeNull()
    expect(screen.queryByText('Base de datos')).toBeNull()
  })

  it('lista cada ficha con su espacio y un enlace para ver sus documentos', async () => {
    api.obtenerResumenAlmacenamiento.mockResolvedValue({
      fichas: [ficha()],
      totales: { documentos: 4, bytes: 2048 },
    })

    montar()

    expect(await screen.findByText('3173334')).toBeTruthy()
    const tabla = screen.getByRole('table')
    expect(within(tabla).getByText('2 KB')).toBeTruthy()
    expect(within(tabla).getByText('3 archivo(s)')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ver documentos' }).getAttribute('href')).toBe('/almacenamiento/fichas/1')
  })

  it('dice «No disponible» si el disco no respondió, sin romper la tabla', async () => {
    api.obtenerResumenAlmacenamiento.mockResolvedValue({
      fichas: [ficha({ almacenamiento: { bytes: null, objetos: null } })],
      totales: { documentos: 4, bytes: 0 },
    })

    montar()

    await waitFor(() => expect(screen.getByText('No disponible')).toBeTruthy())
  })

  it('el buscador filtra las fichas por código o por programa', async () => {
    api.obtenerResumenAlmacenamiento.mockResolvedValue({
      fichas: [ficha(), ficha({ ficha_id: 2, codigo: '2896411', nombre_programa: 'Contabilidad' })],
      totales: { documentos: 8, bytes: 4096 },
    })

    montar()
    const tabla = await screen.findByRole('table')
    expect(within(tabla).getAllByRole('row')).toHaveLength(3)

    fireEvent.change(screen.getByPlaceholderText('Escribe para buscar…'), { target: { value: 'contabilidad' } })
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
    expect(screen.queryByText('3173334')).toBeNull()

    fireEvent.change(screen.getByPlaceholderText('Escribe para buscar…'), { target: { value: 'nada' } })
    expect(screen.getByText('Ninguna ficha coincide')).toBeTruthy()
  })

  it('sin fichas a cargo muestra un estado vacío', async () => {
    api.obtenerResumenAlmacenamiento.mockResolvedValue({ fichas: [], totales: { documentos: 0, bytes: 0 } })

    montar()

    expect(await screen.findByText('No tienes fichas a cargo')).toBeTruthy()
  })

  it('muestra el error si el resumen no carga', async () => {
    api.obtenerResumenAlmacenamiento.mockRejectedValue(new Error('sin respuesta'))

    montar()

    expect(await screen.findByText(/no pudimos conectarnos/i)).toBeTruthy()
  })
})
