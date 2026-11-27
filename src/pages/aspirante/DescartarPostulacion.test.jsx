import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

afterEach(cleanup)

const confirmar = vi.fn()
vi.mock('../../hooks/useConfirmacion', () => ({ useConfirmacion: () => confirmar }))
vi.mock('../../api/postulaciones', () => ({
  listaMisPostulaciones: vi.fn(),
  cambiarEstadoPostulacion: vi.fn(),
  descartarPostulacion: vi.fn(),
}))

import { descartarPostulacion, listaMisPostulaciones } from '../../api/postulaciones'
import { BloqueAcciones } from './PiezasMisPostulaciones'
import { useMisPostulaciones } from './useMisPostulaciones'

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-26T15:00:00-05:00'))
})
afterEach(() => vi.useRealTimers())

const convocatoria = (nombre, cierre) => ({
  id: nombre.length,
  nombre,
  estado: { codigo: 'publicada' },
  fecha_apertura: '2026-09-01',
  fecha_cierre: cierre,
})
const retirada = (id, nombre, cierre) => ({
  id,
  estado: { codigo: 'retirada', nombre: 'Retirada' },
  fecha_retiro: '2026-11-26T10:00:00Z',
  convocatoria: convocatoria(nombre, cierre),
})

describe('BloqueAcciones: postulación retirada', () => {
  const props = (postulacion, ventanaAbierta) => ({
    postulacion,
    publicada: true,
    ventanaAbierta,
    enVuelo: false,
    irADocumentos: vi.fn(),
    cambiarEstado: vi.fn(),
    reabrir: vi.fn(),
    descartar: vi.fn(),
  })

  it('con la convocatoria abierta se puede reabrir y no se ofrece descartar', () => {
    render(<BloqueAcciones {...props(retirada(1, 'Abierta', '2026-12-31'), true)} />)

    expect(screen.getByRole('button', { name: 'Reabrir' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Descartar' })).toBeNull()
  })

  it('con la convocatoria cerrada no hay nada que reabrir: ofrece Descartar y avisa que ya cerró', () => {
    const p = props(retirada(2, 'Cerrada', '2026-10-23'), false)
    render(<BloqueAcciones {...p} />)

    expect(screen.queryByRole('button', { name: 'Reabrir' })).toBeNull()
    expect(screen.getByText(/ya cerró/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(p.descartar).toHaveBeenCalledWith(p.postulacion)
  })

  it('un borrador sigue teniendo su propio «Descartar» (retira el borrador)', () => {
    const borrador = { id: 3, estado: { codigo: 'borrador' }, convocatoria: convocatoria('Con borrador', '2026-12-31') }
    const p = props(borrador, true)
    render(<BloqueAcciones {...p} />)

    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(p.cambiarEstado).toHaveBeenCalledWith(borrador, 'retirada', 'descartar')
    expect(p.descartar).not.toHaveBeenCalled()
  })
})

describe('useMisPostulaciones: descartar', () => {
  const envoltura = ({ children }) => <MemoryRouter>{children}</MemoryRouter>

  async function montar() {
    listaMisPostulaciones.mockResolvedValue({
      data: [retirada(1, 'ingeniero de arte', '2026-10-23'), retirada(2, 'DHJFM', '2026-10-22')],
      meta: { last_page: 1, total: 2 },
    })
    const vista = renderHook(() => useMisPostulaciones(), { wrapper: envoltura })
    await waitFor(() => expect(vista.result.current.postulaciones).toHaveLength(2))
    return vista
  }

  it('al confirmar, la postulación sale de la lista, baja el total y avisa', async () => {
    confirmar.mockResolvedValue(true)
    descartarPostulacion.mockResolvedValue({})
    const { result } = await montar()

    await act(async () => {
      await result.current.contexto(result.current.postulaciones[0]).descartar(result.current.postulaciones[0])
    })

    expect(descartarPostulacion).toHaveBeenCalledWith(1)
    expect(result.current.postulaciones.map((p) => p.id)).toEqual([2])
    expect(result.current.meta.total).toBe(1)
    expect(result.current.exito.texto).toMatch(/descartada/i)
  })

  it('si cancela en la confirmación no se llama al servidor y la lista no cambia', async () => {
    confirmar.mockResolvedValue(false)
    const { result } = await montar()

    await act(async () => {
      await result.current.contexto(result.current.postulaciones[0]).descartar(result.current.postulaciones[0])
    })

    expect(descartarPostulacion).not.toHaveBeenCalled()
    expect(result.current.postulaciones).toHaveLength(2)
  })

  it('si el servidor la rechaza, muestra el mensaje y la fila no desaparece', async () => {
    confirmar.mockResolvedValue(true)
    descartarPostulacion.mockRejectedValue({
      response: { status: 422, data: { errors: { postulacion: ['La convocatoria sigue abierta: aún puedes reabrir esta postulación.'] } } },
    })
    const { result } = await montar()

    await act(async () => {
      await result.current.contexto(result.current.postulaciones[0]).descartar(result.current.postulaciones[0])
    })

    expect(result.current.error).toMatch(/sigue abierta/i)
    expect(result.current.postulaciones.some((p) => p.id === 1)).toBe(true)
  })
})
