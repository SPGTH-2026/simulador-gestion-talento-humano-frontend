import { describe, it, expect, vi, afterEach } from 'vitest'
import { isValidElement } from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePanelDocumentosPostulacion } from './usePanelDocumentosPostulacion'
import * as api from '../../api/postulacionesDocumentos'

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { role: 'aspirante' }, can: () => true }),
}))

vi.mock('../../api/postulacionesDocumentos', () => ({
  estadoDocumentos: vi.fn(),
  obtenerPerfil: vi.fn(),
  obtenerCorreccion: vi.fn(),
  enviarCorreccion: vi.fn(),
  mensajeErrorBlob: vi.fn(),
  dispararDescarga: vi.fn(),
}))

vi.mock('../../api/postulaciones', () => ({
  postularse: vi.fn(),
  cambiarEstadoPostulacion: vi.fn(),
}))

vi.mock('../../api/mensajeError', () => ({
  mensajeError: (e) => String(e?.message ?? e),
}))

const estadoBase = {
  postulacion: { id: 7 },
  convocatoria: { id: 1 },
  documentos: [],
  skills: [],
  sexo: null,
  completo: false,
  requiere: {},
  ventana: { abierta: true },
  editable: true,
}

// Contrato actual: la corrección llega como { correccion: { ronda_actual: { ... } } }.
const correccionVigente = {
  correccion: {
    ronda_actual: { estado: 'vigente', documentos_marcados: [3], documentos_reemplazados: [] },
  },
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('usePanelDocumentosPostulacion (composición)', () => {
  it('carga estado, sexo y corrección, y marca los documentos que el evaluador pidió corregir', async () => {
    api.estadoDocumentos.mockResolvedValue(estadoBase)
    api.obtenerPerfil.mockResolvedValue({ sexo: { codigo: 'mujer' } })
    api.obtenerCorreccion.mockResolvedValue(correccionVigente)

    const { result } = renderHook(() => usePanelDocumentosPostulacion({ postulacionId: 7, convocatoria: { id: 1 } }))

    await waitFor(() => expect(result.current.correccionVigente).toBe(true))
    expect(result.current.marcados.has(3)).toBe(true)
    expect(result.current.marcados.has(4)).toBe(false)
    expect(result.current.corregidos).toBe(0)
    expect(result.current.sexo).toEqual({ codigo: 'mujer' })
    expect(result.current.error).toBe('')
  })

  it('recargar vuelve a leer el estado del servidor y la corrección juntos', async () => {
    api.estadoDocumentos.mockResolvedValue(estadoBase)
    api.obtenerPerfil.mockResolvedValue({ sexo: null })
    api.obtenerCorreccion.mockResolvedValue(null)

    const { result } = renderHook(() => usePanelDocumentosPostulacion({ postulacionId: 7, convocatoria: { id: 1 } }))
    await waitFor(() => expect(typeof result.current.recargar).toBe('function'))
    await waitFor(() => expect(api.estadoDocumentos).toHaveBeenCalledTimes(1))

    await act(() => result.current.recargar())

    expect(api.estadoDocumentos).toHaveBeenCalledTimes(2)
    expect(api.obtenerCorreccion).toHaveBeenCalledTimes(2)
  })

  it('si no puede leer el estado, la pantalla muestra su propio mensaje en vez de los controles', async () => {
    api.estadoDocumentos.mockRejectedValue(new Error('Sin conexión'))
    api.obtenerPerfil.mockResolvedValue({ sexo: null })
    api.obtenerCorreccion.mockResolvedValue(null)

    const { result } = renderHook(() => usePanelDocumentosPostulacion({ postulacionId: 7, convocatoria: { id: 1 } }))

    await waitFor(() => expect(api.estadoDocumentos).toHaveBeenCalled())
    expect(isValidElement(result.current)).toBe(true)
  })
})
