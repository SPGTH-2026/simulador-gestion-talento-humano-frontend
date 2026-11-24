import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// El panel real de Candidatos con los bloqueos que manda el servidor: el resumen por fila, «Listo para elegir» aparte de
// «Seleccionado», la acción que abre el detalle en la pestaña que resuelve el bloqueo y el permiso que la limita.
const sesion = vi.hoisted(() => ({ role: 'instructor', decidir: true }))
vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { role: sesion.role }, can: (p) => (p === 'seleccion:decidir' ? sesion.decidir : true) }),
}))
vi.mock('../../api/seleccion', () => ({
  candidatosConvocatoria: vi.fn(),
  obtenerCalificaciones: vi.fn(),
  obtenerReferencia: vi.fn(),
}))

import { candidatosConvocatoria, obtenerCalificaciones, obtenerReferencia } from '../../api/seleccion'
import PanelCandidatos from './PanelCandidatos'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  sesion.role = 'instructor'
  sesion.decidir = true
  Element.prototype.scrollIntoView = vi.fn()
  obtenerCalificaciones.mockResolvedValue(new Promise(() => {}))
  obtenerReferencia.mockResolvedValue(new Promise(() => {}))
})

const fila = (id, aspirante, extra) => ({ id, aspirante, estado_documental: 'habilitado', cumplimiento: 100, ...extra })
const respuesta = (data) => ({ data, meta: { current_page: 1, last_page: 1, per_page: 20, total: data.length } })
const montar = () =>
  render(
    <MemoryRouter>
      <PanelCandidatos convocatoriaId={109} activo />
    </MemoryRouter>,
  )

describe('PanelCandidatos con los bloqueos del servidor', () => {
  it('rotula «Listo para elegir» a los listos y resume el motivo de los demás', async () => {
    candidatosConvocatoria.mockResolvedValue(
      respuesta([
        fila(1, 'Ana Lista', { listo: true, bloqueos: [] }),
        fila(2, 'Beto Sin Documento', { listo: false, bloqueos: [{ codigo: 'documentos_obligatorios', faltantes: [{ codigo: 'id', nombre: 'Documento de identidad' }] }] }),
      ]),
    )
    montar()

    expect(await screen.findByText('Listo para elegir')).toBeTruthy()
    expect(screen.getByText('Faltan documentos obligatorios: Documento de identidad.')).toBeTruthy()
    // Listo para elegir no es «Seleccionado»: seleccionar es una decisión posterior.
    expect(screen.queryByText(/Seleccionado/)).toBeNull()
  })

  it('la acción del bloqueo abre el detalle en la pestaña que lo resuelve', async () => {
    candidatosConvocatoria.mockResolvedValue(respuesta([fila(3, 'Cami Referencia', { listo: false, bloqueos: [{ codigo: 'referencia_requerida' }] })]))
    montar()

    fireEvent.click(await screen.findByRole('button', { name: 'Designar referencia' }))

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('tab', { name: 'Referencia documental' }).getAttribute('aria-selected')).toBe('true')
  })

  it('sin ser Instructor o Superadministrador no se ofrece designar la referencia', async () => {
    sesion.role = 'aprendiz'
    candidatosConvocatoria.mockResolvedValue(respuesta([fila(4, 'Davi General', { listo: false, bloqueos: [{ codigo: 'revision_documental' }] })]))
    montar()

    expect(await screen.findByText(/Requiere una revisión documental que designa un instructor/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Designar/ })).toBeNull()
  })
})
