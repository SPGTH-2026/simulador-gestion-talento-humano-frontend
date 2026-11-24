import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Regresión: al decidir «Seleccionado» sobre el último finalista pendiente, la pantalla aplicaba al instante los cupos de la
// respuesta (0 disponibles) pero «Pendientes de decisión» seguía con el valor anterior (1) hasta que terminaba la relectura.
// En ese intervalo se cumplía «sin cupos y con pendientes» y parpadeaba el aviso amarillo «No quedan cupos disponibles…».
vi.mock('../../api/seleccion', () => ({
  decisionesConvocatoria: vi.fn(),
  guardarDecision: vi.fn(),
  historialDecision: vi.fn(),
  obtenerCalificaciones: vi.fn(),
}))

import { decisionesConvocatoria, guardarDecision } from '../../api/seleccion'
import PanelDecisiones from './PanelDecisiones'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  Element.prototype.scrollIntoView = vi.fn()
})

const AVISO_SIN_CUPOS = /No quedan cupos disponibles/
const fila = (id, nombre, estado = 'pendiente', extra = {}) => ({
  postulacion_id: id, aspirante: nombre, posicion: null, en_lista: true, estado, decision: null,
  requiere_revision: false, motivo_revision: null, confirmada: null, actual: null, sustento: null, ...extra,
})
const lectura = ({ filas, pendientes, disponibles }) => ({
  data: filas,
  meta: {
    current_page: 1, last_page: 1, per_page: 20, total: filas.length, estado_convocatoria: 'en_proceso', pendientes,
    cupos: { vacantes_totales: 1, cupos_ocupados: 1 - disponibles, cupos_disponibles: disponibles },
    lista: { version: 1, total: filas.length, requiere_revision: false, modo: 'sin_actividades', confirmada_por: 'Instructor', confirmada_en: '2026-11-23T20:00:00Z' },
  },
})

const montar = () => render(<MemoryRouter><PanelDecisiones convocatoriaId={107} enProceso puedeDecidir /></MemoryRouter>)

const decidirSeleccionado = async (nombre) => {
  fireEvent.click(await screen.findByRole('button', { name: `Decidir sobre ${nombre}` }))
  fireEvent.click(await screen.findByRole('radio', { name: /^Seleccionado/ }))
  fireEvent.change(screen.getByLabelText(/Justificación/), { target: { value: 'Cumple el perfil de la convocatoria' } })
  fireEvent.click(screen.getByRole('button', { name: 'Guardar decisión' }))
}

describe('PanelDecisiones: aviso de cupos tras decidir', () => {
  it('al ocupar el último cupo con el último pendiente no parpadea «No quedan cupos» mientras se relee', async () => {
    let terminarRelectura
    decisionesConvocatoria
      .mockResolvedValueOnce(lectura({ filas: [fila(477, 'Func B1')], pendientes: 1, disponibles: 1 }))
      .mockReturnValueOnce(new Promise((r) => { terminarRelectura = r }))
    guardarDecision.mockResolvedValue({
      data: {
        postulacion_id: 477, aspirante: 'Func B1', estado: 'seleccionado',
        decision: { resultado: 'seleccionado', motivo: 'Cumple el perfil de la convocatoria', lista_version: 1, decidida_por: 'Instructor', decidida_en: '2026-11-23T21:00:00Z' },
        cupos: { vacantes_totales: 1, cupos_ocupados: 1, cupos_disponibles: 0 },
      },
    })
    montar()
    expect(screen.queryByText(AVISO_SIN_CUPOS)).toBeNull()

    await decidirSeleccionado('Func B1')

    // Guardada (confirmación visible) pero la relectura aún no llega: no debe aparecer el aviso amarillo.
    expect(await screen.findByText(/Decisión guardada/)).toBeTruthy()
    expect(screen.queryByText(AVISO_SIN_CUPOS)).toBeNull()

    terminarRelectura(lectura({ filas: [fila(477, 'Func B1', 'seleccionado')], pendientes: 0, disponibles: 0 }))
    await waitFor(() => expect(decisionesConvocatoria).toHaveBeenCalledTimes(2))
    expect(screen.queryByText(AVISO_SIN_CUPOS)).toBeNull()
  })

  it('con OTROS pendientes y sin cupos el aviso sí aparece, y se queda', async () => {
    decisionesConvocatoria
      .mockResolvedValueOnce(lectura({ filas: [fila(477, 'Func B1'), fila(479, 'Func B3')], pendientes: 2, disponibles: 1 }))
      .mockResolvedValueOnce(lectura({ filas: [fila(477, 'Func B1', 'seleccionado'), fila(479, 'Func B3')], pendientes: 1, disponibles: 0 }))
    guardarDecision.mockResolvedValue({
      data: {
        postulacion_id: 477, aspirante: 'Func B1', estado: 'seleccionado',
        decision: { resultado: 'seleccionado', motivo: 'Cumple el perfil de la convocatoria', lista_version: 1, decidida_por: 'Instructor', decidida_en: '2026-11-23T21:00:00Z' },
        cupos: { vacantes_totales: 1, cupos_ocupados: 1, cupos_disponibles: 0 },
      },
    })
    montar()

    await decidirSeleccionado('Func B1')

    expect(await screen.findByText(AVISO_SIN_CUPOS)).toBeTruthy()
    await waitFor(() => expect(decisionesConvocatoria).toHaveBeenCalledTimes(2))
    expect(screen.getByText(AVISO_SIN_CUPOS)).toBeTruthy()
  })
})
