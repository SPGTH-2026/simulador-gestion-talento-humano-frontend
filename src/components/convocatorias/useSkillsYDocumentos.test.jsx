import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../../api/convocatorias', () => ({ crearDocumentoCatalogo: vi.fn() }))

import { crearDocumentoCatalogo } from '../../api/convocatorias'
import useSkillsYDocumentos from './useSkillsYDocumentos'

beforeEach(() => vi.clearAllMocks())

const montar = () =>
  renderHook(() =>
    useSkillsYDocumentos({
      form: { documentos: [], skills: [], ponderaciones: {} },
      setForm: vi.fn(),
      catalogos: { tipo_documento: [] },
      setCatalogos: vi.fn(),
    }),
  )

describe('guardar un documento nuevo en el catálogo', () => {
  it('no envía dos veces aunque lleguen dos órdenes seguidas (Enter y clic antes del siguiente render)', async () => {
    let terminar
    crearDocumentoCatalogo.mockReturnValue(new Promise((r) => { terminar = r }))
    const { result } = montar()
    act(() => result.current.setNuevoDocumento('Especialización en SST'))

    await act(async () => {
      result.current.agregarDocumentoCatalogo()
      result.current.agregarDocumentoCatalogo()
    })
    expect(crearDocumentoCatalogo).toHaveBeenCalledTimes(1)
    expect(result.current.guardandoDocumento).toBe(true)

    await act(async () => terminar({ id: 9, codigo: 'especializacion_sst', nombre: 'Especialización en SST' }))
    expect(result.current.guardandoDocumento).toBe(false)
    expect(result.current.nuevoDocumento).toBe('')
  })

  it('si falla vuelve al estado normal: muestra el error, conserva lo escrito y permite reintentar', async () => {
    crearDocumentoCatalogo.mockRejectedValueOnce(new Error('Sin conexión'))
    const { result } = montar()
    act(() => result.current.setNuevoDocumento('Maestría en Gestión'))

    await act(async () => {
      await result.current.agregarDocumentoCatalogo()
    })
    expect(result.current.guardandoDocumento).toBe(false)
    expect(result.current.errorDocumento).toContain('No pudimos conectarnos')
    expect(result.current.nuevoDocumento).toBe('Maestría en Gestión')

    crearDocumentoCatalogo.mockResolvedValueOnce({ id: 10, codigo: 'maestria', nombre: 'Maestría en Gestión' })
    await act(async () => {
      await result.current.agregarDocumentoCatalogo()
    })
    expect(crearDocumentoCatalogo).toHaveBeenCalledTimes(2)
    expect(result.current.errorDocumento).toBe('')
  })

  it('no envía un nombre demasiado corto', async () => {
    const { result } = montar()
    act(() => result.current.setNuevoDocumento('ab'))
    await act(async () => {
      await result.current.agregarDocumentoCatalogo()
    })
    expect(crearDocumentoCatalogo).not.toHaveBeenCalled()
    expect(result.current.errorDocumento).toContain('al menos 3 caracteres')
  })
})
