import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AlmacenamientoFicha from './AlmacenamientoFicha'
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

const documento = (extra) => ({
  tipo: 'adicional',
  titulo: 'Diploma',
  obligatorio: false,
  borrable: true,
  aspirante: 'Ana Pérez',
  convocatoria: 'Auxiliar',
  tamano_bytes: 1024,
  creado_at: '2026-11-20T10:00:00+00:00',
  ...extra,
})

const respuestaListado = (documentos) => ({
  ficha: { id: 7, codigo: '3173334', nombre_programa: 'ADSO' },
  data: documentos,
  meta: { current_page: 1, last_page: 1, per_page: 20, total: documentos.length },
})

function montar() {
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

describe('Documentos de una ficha', () => {
  it('no deja marcar un documento obligatorio', async () => {
    api.listaDocumentosFicha.mockResolvedValue(
      respuestaListado([
        documento({ id: 1, titulo: 'Hoja de vida', tipo: 'requerido', obligatorio: true, borrable: false }),
        documento({ id: 2, titulo: 'Diploma' }),
      ]),
    )

    montar()

    const casillaObligatorio = await screen.findByRole('checkbox', { name: /seleccionar hoja de vida/i })
    expect(casillaObligatorio.disabled).toBe(true)
    expect(screen.getByRole('checkbox', { name: /seleccionar diploma/i }).disabled).toBe(false)
  })

  it('borrar pide confirmación y envía solo los marcados', async () => {
    api.borrarDocumentos.mockResolvedValue({ borrados: [2], omitidos: [] })
    api.listaDocumentosFicha
      .mockResolvedValueOnce(respuestaListado([documento({ id: 2, titulo: 'Diploma' })]))
      .mockResolvedValueOnce(respuestaListado([]))

    montar()
    fireEvent.click(await screen.findByRole('checkbox', { name: /seleccionar diploma/i }))
    fireEvent.click(screen.getByRole('button', { name: /borrar 1 seleccionado/i }))

    await waitFor(() => expect(confirmarMock).toHaveBeenCalledTimes(1))
    expect(confirmarMock.mock.calls[0][0].peligro).toBe(true)
    await waitFor(() => expect(api.borrarDocumentos).toHaveBeenCalledWith([2]))
  })

  it('si no confirma, no borra nada', async () => {
    confirmarMock.mockResolvedValue(false)
    api.listaDocumentosFicha.mockResolvedValue(respuestaListado([documento({ id: 2 })]))

    montar()
    fireEvent.click(await screen.findByRole('checkbox', { name: /seleccionar diploma/i }))
    fireEvent.click(screen.getByRole('button', { name: /borrar 1 seleccionado/i }))

    await waitFor(() => expect(confirmarMock).toHaveBeenCalled())
    expect(api.borrarDocumentos).not.toHaveBeenCalled()
  })

  it('muestra cuántos se borraron y por qué no se borró el resto', async () => {
    // Primera carga: diploma y certificado. Recarga tras borrar: solo queda el certificado.
    api.listaDocumentosFicha
      .mockResolvedValueOnce(respuestaListado([documento({ id: 2, titulo: 'Diploma' }), documento({ id: 3, titulo: 'Certificado' })]))
      .mockResolvedValueOnce(respuestaListado([documento({ id: 3, titulo: 'Certificado' })]))
    api.borrarDocumentos.mockResolvedValue({
      borrados: [2],
      omitidos: [{ id: 3, motivo: 'Este documento es obligatorio y no se puede eliminar.' }],
    })

    montar()
    fireEvent.click(await screen.findByRole('checkbox', { name: /seleccionar diploma/i }))
    fireEvent.click(screen.getByRole('button', { name: /borrar 1 seleccionado/i }))

    expect(await screen.findByText('Se borró 1 documento.')).toBeTruthy()
    expect(await screen.findByText(/obligatorio y no se puede eliminar/i)).toBeTruthy()
  })
})
