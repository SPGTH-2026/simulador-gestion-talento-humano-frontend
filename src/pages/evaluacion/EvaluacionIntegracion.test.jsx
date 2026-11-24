import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Integración de lo que llegó de develop (reapertura y bloqueo de «No cumple») con el visor interno de documentos.
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { id: 1, role: 'aprendiz' }, can: () => true }) }))
vi.mock('../../hooks/useConfirmacion', () => ({ useConfirmacion: () => vi.fn() }))
vi.mock('../../api/evaluaciones', () => ({ obtenerEvaluacion: vi.fn(), guardarEvaluacion: vi.fn() }))
vi.mock('../../api/documentos', () => ({ listaDocumentos: vi.fn() }))
vi.mock('../../api/archivos', () => ({ obtenerArchivo: vi.fn() }))
vi.mock('../../api/postulacionesDocumentos', () => ({ dispararDescarga: vi.fn(), mensajeErrorBlob: vi.fn(async () => '') }))

import { obtenerEvaluacion } from '../../api/evaluaciones'
import { listaDocumentos } from '../../api/documentos'
import { obtenerArchivo } from '../../api/archivos'
import EvaluacionEvaluar from './EvaluacionEvaluar'

const base = (evaluacion, correccion) => ({
  data: {
    id: 9,
    correccion,
    estado: 'Postulada',
    aspirante: { id: 3, name: 'Aspirante Prueba', email: 'a@test.com' },
    convocatoria: { id: 4, titulo: 'Convocatoria de prueba', estado: 'publicada' },
    documentos: { total: 1, cargados: 1 },
    skills: [],
    evaluacion,
  },
})
const evaluacion = {
  id: 50, estado: 'en_proceso', observaciones: '', perfil: { 10: false }, documentos_actualizados: [],
  reabierta: { motivo: 'El aspirante cambió un documento.', at: '2026-11-23T10:00:00Z' },
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/evaluacion/evaluar/9']}>
      <Routes>
        <Route path="/evaluacion/evaluar/:postulacionId" element={<EvaluacionEvaluar />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn(() => 'blob:x')
  URL.revokeObjectURL = vi.fn()
  window.open = vi.fn()
  listaDocumentos.mockResolvedValue({
    data: [{ id: 10, nombre: 'Documento de identidad', obligatorio: true, estado: 'subido', archivo: { id: 1, nombre_original: 'cedula.pdf' } }],
  })
  obtenerArchivo.mockResolvedValue(new Blob(['%PDF-1.4 x'], { type: 'application/pdf' }))
})
afterEach(cleanup)

describe('Evaluación: reapertura, «No cumple» y visor', () => {
  it('muestra el aviso de reapertura y bloquea finalizar con un «No cumple» mientras la corrección siga', async () => {
    obtenerEvaluacion.mockResolvedValue(base(evaluacion, { puede_solicitar: true, motivo: 'quedan' }))
    montar()
    expect(await screen.findByText('Evaluación reabierta.')).toBeTruthy()
    const finalizar = screen.getByRole('button', { name: 'Finalizar y enviar resultado' })
    expect(finalizar.disabled).toBe(true)
    expect(screen.getByText(/Marcados como «No cumple»: Documento de identidad/)).toBeTruthy()
  })

  it('permite finalizar con «No cumple» cuando las correcciones se agotaron', async () => {
    obtenerEvaluacion.mockResolvedValue(base(evaluacion, { puede_solicitar: false, motivo: 'agotadas' }))
    montar()
    await screen.findByText('Evaluación reabierta.')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Finalizar y enviar resultado' }).disabled).toBe(false))
    expect(screen.queryByText(/Marcados como «No cumple»/)).toBeNull()
  })

  it('«Ver documento» abre el visor interno con la ruta de revisión y, al cerrarlo, la pantalla conserva su estado', async () => {
    obtenerEvaluacion.mockResolvedValue(base(evaluacion, { puede_solicitar: true, motivo: 'quedan' }))
    montar()
    await screen.findByText('Evaluación reabierta.')
    const ver = screen.getByRole('button', { name: 'Ver documento: Documento de identidad' })
    ver.focus()
    fireEvent.click(ver)
    expect(await screen.findByRole('dialog', { name: 'Documento de identidad' })).toBeTruthy()
    expect(obtenerArchivo.mock.calls[0][0]).toBe('/revision/postulaciones/9/documentos/1/archivo?inline=1')
    expect(window.open).not.toHaveBeenCalled()
    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(ver)
    // Sigue el aviso y el bloqueo: abrir y cerrar el visor no toca la evaluación.
    expect(screen.getByText('Evaluación reabierta.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Finalizar y enviar resultado' }).disabled).toBe(true)
  })
})
