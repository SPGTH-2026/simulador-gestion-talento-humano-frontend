import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

afterEach(cleanup)

vi.mock('../../hooks/useConfirmacion', () => ({ useConfirmacion: () => vi.fn() }))
vi.mock('../../api/postulacionesDocumentos', () => ({ subirDocumento: vi.fn(), eliminarDocumento: vi.fn() }))

import SeccionDocumentosRequeridos from './SeccionDocumentosRequeridos'

const archivo = (id) => ({ id, nombre_original: `doc${id}.pdf`, tamano_bytes: 1024, subido_en: '2026-11-22T10:00:00Z' })
const vista = {
  postulacion: { id: 5, estado: { codigo: 'postulada' } },
  documentos: [
    { id: 1, parametro: { id: 10, codigo: 'identidad', nombre: 'Documento de identidad' }, obligatorio: true, estado: 'subido', archivo: archivo(1) },
    { id: 2, parametro: { id: 20, codigo: 'tarjeta', nombre: 'Tarjeta profesional' }, obligatorio: false, estado: 'subido', archivo: archivo(2) },
    { id: 3, parametro: { id: 30, codigo: 'curso', nombre: 'Curso opcional' }, obligatorio: false, estado: 'subido', archivo: archivo(3) },
  ],
}
const base = { vista, editable: true, sexo: null, asegurar: vi.fn(), onRecargar: vi.fn(), onError: vi.fn() }

describe('SeccionDocumentosRequeridos', () => {
  it('fuera de una corrección ofrece Eliminar solo en los opcionales cargados', () => {
    render(<SeccionDocumentosRequeridos {...base} />)
    expect(screen.getAllByRole('button', { name: 'Eliminar' })).toHaveLength(2)
  })

  it('con corrección vigente: reemplaza solo lo marcado, no ofrece Eliminar y explica cada bloqueo', () => {
    const correccion = { marcados: new Set([10, 20]), reemplazados: new Set() }
    render(<SeccionDocumentosRequeridos {...base} correccion={correccion} bloqueoCorreccion />)

    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
    // Opcional marcado: se explica que no se elimina (y sí se puede reemplazar).
    expect(screen.getByText(/no se eliminan documentos/i)).toBeTruthy()
    // Opcional NO marcado: botón de reemplazo deshabilitado y con el motivo del servidor.
    const reemplazos = screen.getAllByRole('button', { name: 'Reemplazar' })
    expect(reemplazos).toHaveLength(3)
    expect(reemplazos[0].disabled).toBe(false)
    expect(reemplazos[1].disabled).toBe(false)
    expect(reemplazos[2].disabled).toBe(true)
    expect(screen.getByText(/solo puedes reemplazar los documentos que el evaluador marcó/i)).toBeTruthy()
  })
})
