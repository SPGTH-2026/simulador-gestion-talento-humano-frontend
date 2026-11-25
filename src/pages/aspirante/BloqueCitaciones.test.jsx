import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render as renderBase, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../api/citaciones', () => ({ misCitaciones: vi.fn() }))

import { misCitaciones } from '../../api/citaciones'
import BloqueCitaciones from './BloqueCitaciones'

const cita = (extra = {}) => ({
  id: 1, postulacion_id: 3, actividad: 'entrevista', actividad_etiqueta: 'Entrevista', estado: 'programada', fecha: '2030-01-15', hora: '14:30',
  lugar_o_enlace: 'Sala 3', es_enlace: false, indicaciones: null, motivo_cancelacion: null, convocatoria: 'Instructor de ADSO', ...extra,
})

const render = (ui, ruta = '/mis-postulaciones') => renderBase(<MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>)

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('Tus citaciones (aspirante)', () => {
  it('muestra las citas con la convocatoria por nombre, la hora de Colombia y el motivo de las canceladas, sin datos internos', async () => {
    misCitaciones.mockResolvedValue({ data: [cita(), cita({ id: 2, estado: 'cancelada', convocatoria: 'Analista de datos', actividad: 'prueba_tecnica', actividad_etiqueta: 'Prueba técnica', motivo_cancelacion: 'Se suspendió la jornada.' })] })
    render(<BloqueCitaciones />)
    const bloque = await screen.findByRole('region', { name: 'Tus citaciones' })
    expect(within(bloque).getByText('Instructor de ADSO')).toBeTruthy()
    expect(within(bloque).getAllByText(/martes, 15 de enero de 2030, 14:30$/)).toHaveLength(2)
    expect(within(bloque).getByText('Se suspendió la jornada.')).toBeTruthy()
    expect(within(bloque).getByText('Cancelada')).toBeTruthy()
    expect(within(bloque).queryByText(/Historial/)).toBeNull()
    expect(within(bloque).queryByRole('button')).toBeNull()
  })

  it('sin citas no muestra nada', async () => {
    misCitaciones.mockResolvedValue({ data: [] })
    const { container } = render(<BloqueCitaciones />)
    await vi.waitFor(() => expect(misCitaciones).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })

  it('un fallo se explica y se puede reintentar', async () => {
    misCitaciones.mockRejectedValueOnce({ response: { status: 500, data: { message: 'Falló' }, headers: {} } })
    misCitaciones.mockResolvedValueOnce({ data: [cita()] })
    render(<BloqueCitaciones />)
    expect(await screen.findByText(/No pudimos cargar tus citaciones/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('region', { name: 'Tus citaciones' })).toBeTruthy()
  })

  it('el enlace del aviso (?cita=ID) resalta y enfoca esa cita; un ID ajeno o inexistente no resalta nada', async () => {
    misCitaciones.mockResolvedValue({ data: [cita(), cita({ id: 2, convocatoria: 'Analista de datos', actividad: 'prueba_tecnica', actividad_etiqueta: 'Prueba técnica' })] })
    render(<BloqueCitaciones />, '/mis-postulaciones?cita=2')
    const resaltada = await screen.findByLabelText('Cita de tu aviso')
    expect(within(resaltada).getByText('Analista de datos')).toBeTruthy()
    await vi.waitFor(() => expect(document.activeElement).toBe(resaltada))
    expect(screen.getAllByLabelText('Cita de tu aviso')).toHaveLength(1)
    cleanup()
    render(<BloqueCitaciones />, '/mis-postulaciones?cita=999')
    await screen.findByRole('region', { name: 'Tus citaciones' })
    expect(screen.queryByLabelText('Cita de tu aviso')).toBeNull()
  })
})
