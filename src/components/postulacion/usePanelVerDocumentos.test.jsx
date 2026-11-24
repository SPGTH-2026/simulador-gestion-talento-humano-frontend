import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'

vi.mock('../../api/archivos', () => ({ obtenerArchivo: vi.fn() }))
vi.mock('../../api/postulacionesDocumentos', () => ({ dispararDescarga: vi.fn(), mensajeErrorBlob: vi.fn(async () => '') }))

import { obtenerArchivo } from '../../api/archivos'
import { usePanelVerDocumentos } from './usePanelVerDocumentos'

function Panel() {
  const visor = usePanelVerDocumentos({ idPostulacion: 77 })
  return <div>{visor}</div>
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:x')
  URL.revokeObjectURL = vi.fn()
  window.open = vi.fn()
  obtenerArchivo.mockResolvedValue(new Blob(['%PDF-1.4 x'], { type: 'application/pdf' }))
})
afterEach(cleanup)

describe('usePanelVerDocumentos', () => {
  it.each([
    ['documento', { documentoId: 5, nombre: 'a.pdf' }, '/postulaciones/77/documentos/5/archivo?inline=1', 'a.pdf'],
    ['certificado de skill', { skillId: 9, nombre: 'c.pdf', titulo: 'Certificado: SQL' }, '/postulaciones/77/skills/9/certificado/archivo?inline=1', 'Certificado: SQL'],
  ])('«Ver» %s abre el visor interno con la ruta autorizada y sin pestañas', async (_n, detail, ruta, titulo) => {
    render(<Panel />)
    act(() => {
      window.dispatchEvent(new CustomEvent('document:view', { detail }))
    })
    expect(await screen.findByRole('dialog', { name: titulo })).toBeTruthy()
    expect(obtenerArchivo.mock.calls[0][0]).toBe(ruta)
    expect(window.open).not.toHaveBeenCalled()
  })
})
