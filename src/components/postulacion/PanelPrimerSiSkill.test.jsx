import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

// Regresión: el primer activado de una skill, sin postulación todavía, crea el borrador silencioso y declara la skill. La pantalla
// debe terminar mostrando la skill declarada. Antes el «recargar» que usaba la sección era el del render anterior (sin id de
// postulación) y no releía nada: solo llegaba la lectura que el efecto pidió ANTES del guardado, y la fila se quedaba en «No».
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { id: 1, role: 'aspirante' } }) }))
vi.mock('../../hooks/useConfirmacion', () => ({ useConfirmacion: () => vi.fn() }))
vi.mock('../../api/postulaciones', () => ({ postularse: vi.fn(), cambiarEstadoPostulacion: vi.fn() }))
vi.mock('../../api/postulacionesDocumentos', async (original) => ({
  ...(await original()),
  estadoDocumentos: vi.fn(),
  obtenerPerfil: vi.fn(),
  obtenerCorreccion: vi.fn(),
  declararSkill: vi.fn(),
}))

import { postularse } from '../../api/postulaciones'
import { declararSkill, estadoDocumentos, obtenerCorreccion, obtenerPerfil } from '../../api/postulacionesDocumentos'
import PanelDocumentosPostulacion from './PanelDocumentosPostulacion'

afterEach(cleanup)

const convocatoria = {
  id: 4,
  nombre: 'Convocatoria con skills',
  estado: { codigo: 'publicada' },
  fecha_apertura: '2020-01-01',
  fecha_cierre: '2099-12-31',
}
const base = {
  postulacion: { id: 7, user_id: 1, estado: { codigo: 'borrador', nombre: 'Borrador' } },
  convocatoria: { id: 4, nombre: 'Convocatoria con skills' },
  ventana: 'abierta',
  editable: true,
  completo: false,
  requiere_sexo: false,
  sexo: null,
  documentos: [],
  adicionales: [],
  skills_convocatoria: [{ id: 21, nombre: 'Adaptabilidad' }],
}
const sinDeclarar = { ...base, skills: [] }
const declarada = {
  ...base,
  skills: [{ id: 27, nombre: 'Adaptabilidad', origen: 'convocatoria', convocatoria_skill_id: 21, certificado: null }],
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('primer activado de una skill sin postulación', () => {
  it('crea el borrador, declara la skill y la fila queda declarada con una lectura posterior al guardado', async () => {
    postularse.mockResolvedValue({ id: 7 })
    obtenerPerfil.mockResolvedValue({ sexo: null })
    obtenerCorreccion.mockResolvedValue(null)

    // El estado que devuelve el servidor depende de si la skill ya se guardó (la lectura vieja trae «sin declarar»).
    let guardada = false
    const lecturasTrasGuardar = []
    estadoDocumentos.mockImplementation(async () => {
      if (guardada) lecturasTrasGuardar.push(true)
      return guardada ? declarada : sinDeclarar
    })
    declararSkill.mockImplementation(async () => {
      await new Promise((r) => setTimeout(r, 30))
      guardada = true
      return { id: 27 }
    })

    render(<PanelDocumentosPostulacion convocatoria={convocatoria} documentosConvocatoria={[]} skillsConvocatoriaNombres={['Adaptabilidad']} />)

    fireEvent.click(await screen.findByRole('switch', { name: 'Adaptabilidad' }))

    await waitFor(() => expect(declararSkill).toHaveBeenCalledWith(7, { convocatoriaSkillId: 21 }))
    // Tras el guardado se relee el estado y la fila pasa a «Declarada» (Sí marcado).
    await waitFor(() => expect(screen.getByText('Declarada')).toBeTruthy())
    expect(screen.getByRole('switch', { name: 'Adaptabilidad' }).getAttribute('aria-checked')).toBe('true')
    expect(lecturasTrasGuardar.length).toBeGreaterThan(0)
  })

  it('no repite la lectura del borrador recién creado y, si falla, permite reintentar', async () => {
    postularse.mockResolvedValue({ id: 7 })
    obtenerPerfil.mockResolvedValue({ sexo: null })
    obtenerCorreccion.mockResolvedValue(null)
    estadoDocumentos.mockResolvedValue(sinDeclarar)
    declararSkill.mockRejectedValue(new Error('Falla simulada'))

    render(<PanelDocumentosPostulacion convocatoria={convocatoria} documentosConvocatoria={[]} skillsConvocatoriaNombres={['Adaptabilidad']} />)
    fireEvent.click(await screen.findByRole('switch', { name: 'Adaptabilidad' }))

    await waitFor(() => expect(declararSkill).toHaveBeenCalled())
    // Dos lecturas: la de crear el borrador y la de recuperación tras el error. El efecto por id nuevo ya no añade una tercera.
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Adaptabilidad' }).getAttribute('aria-busy')).toBeNull())
    expect(estadoDocumentos).toHaveBeenCalledTimes(2)
    // El error permite recuperarse: la fila sigue en «No» y se puede volver a intentar.
    expect(screen.getByRole('switch', { name: 'Adaptabilidad' }).getAttribute('aria-checked')).toBe('false')
  })
})
