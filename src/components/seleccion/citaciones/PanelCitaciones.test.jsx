import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

vi.mock('../../../api/citaciones', () => ({
  citacionesDeCandidato: vi.fn(), programarCita: vi.fn(), reprogramarCita: vi.fn(), cancelarCita: vi.fn(), misCitaciones: vi.fn(),
}))

import { cancelarCita, programarCita, reprogramarCita } from '../../../api/citaciones'
import PanelCitaciones from './PanelCitaciones'

const cita = (extra = {}) => ({
  id: 7, postulacion_id: 3, actividad: 'entrevista', actividad_etiqueta: 'Entrevista', estado: 'programada', fecha: '2030-01-15', hora: '14:30',
  lugar_o_enlace: 'Sala 3', es_enlace: false, indicaciones: 'Llega temprano.', motivo_cancelacion: null, historial: [{ tipo: 'programada', por: 'Ana', en: '2029-12-01T10:00:00Z' }], ...extra,
})
const datos = (extra = {}) => ({
  actividades: [{ id: 'entrevista', etiqueta: 'Entrevista' }, { id: 'prueba_tecnica', etiqueta: 'Prueba técnica' }], razon: null, citaciones: [], ...extra,
})
const falla422 = (campo, mensaje) => ({ response: { status: 422, data: { message: mensaje, errors: { [campo]: [mensaje] } }, headers: {} } })
const recargar = vi.fn()
const pintar = (d, puedeDecidir = true) => render(<PanelCitaciones convocatoriaId={1} postulacionId={3} puedeDecidir={puedeDecidir} ctx={{ datos: d, error: '', recargar }} />)

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('Citaciones en Selección', () => {
  it('ofrece programar solo las actividades activas, con la hora de Colombia', () => {
    pintar(datos({ actividades: [{ id: 'prueba_tecnica', etiqueta: 'Prueba técnica' }], citaciones: [cita({ id: 8, actividad: 'prueba_tecnica', actividad_etiqueta: 'Prueba técnica' })] }))
    expect(screen.getByText(/martes, 15 de enero de 2030, 14:30 \(hora de Colombia\)/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Programar entrevista/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Reprogramar' })).toBeTruthy()
  })

  it('sin actividades no ofrece nada', () => {
    pintar(datos({ actividades: [], razon: 'Esta convocatoria no tiene actividades presenciales activas.' }))
    expect(screen.getByText('No se ofrecen citaciones en esta convocatoria.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('quien solo consulta ve las citas pero no los botones; si hay una razón de bloqueo, tampoco', () => {
    pintar(datos({ citaciones: [cita()] }), false)
    expect(screen.getByText('Sala 3')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Programar|Reprogramar|Cancelar cita/ })).toBeNull()
    cleanup()
    pintar(datos({ razon: 'Solo se pueden programar citas con la convocatoria en proceso.' }))
    expect(screen.getByText('Solo se pueden programar citas con la convocatoria en proceso.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Programar/ })).toBeNull()
  })

  it('programa una cita, evita el doble envío, avisa y recarga', async () => {
    let terminar
    programarCita.mockImplementationOnce(() => new Promise((r) => { terminar = () => r({ data: cita() }) }))
    pintar(datos())
    fireEvent.click(screen.getByRole('button', { name: 'Programar entrevista' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Programar entrevista' })
    fireEvent.change(within(dialogo).getByLabelText(/Fecha/), { target: { value: '2030-01-15' } })
    fireEvent.change(within(dialogo).getByLabelText(/Hora/), { target: { value: '14:30' } })
    fireEvent.change(within(dialogo).getByLabelText(/Lugar o enlace/), { target: { value: 'https://meet.example.com/x' } })
    const enviar = within(dialogo).getByRole('button', { name: 'Programar' })
    fireEvent.click(enviar)
    fireEvent.click(enviar)
    fireEvent.submit(dialogo.querySelector('form'))
    expect(programarCita).toHaveBeenCalledTimes(1)
    expect(programarCita).toHaveBeenCalledWith(1, 3, { fecha: '2030-01-15', hora: '14:30', lugar_o_enlace: 'https://meet.example.com/x', indicaciones: '', actividad: 'entrevista' })
    expect(within(dialogo).getByRole('button', { name: 'Guardando…' }).getAttribute('aria-busy')).toBe('true')
    expect(within(dialogo).getByRole('button', { name: 'Cerrar' }).disabled).toBe(true)
    terminar()
    expect(await screen.findByText('La entrevista quedó programada. Avisamos al aspirante.')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(recargar).toHaveBeenCalled()
  })

  it('un error del servidor aparece junto al campo y conserva lo escrito', async () => {
    programarCita.mockRejectedValueOnce(falla422('lugar_o_enlace', 'Si es un enlace, debe empezar por http:// o https:// y no tener espacios.'))
    pintar(datos())
    fireEvent.click(screen.getByRole('button', { name: 'Programar entrevista' }))
    const dialogo = await screen.findByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText(/Lugar o enlace/), { target: { value: 'javascript:alert(1)' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Programar' }))
    expect(await within(dialogo).findByText(/debe empezar por http/)).toBeTruthy()
    expect(within(dialogo).getByLabelText(/Lugar o enlace/).value).toBe('javascript:alert(1)')
    expect(within(dialogo).getByLabelText(/Lugar o enlace/).getAttribute('aria-invalid')).toBe('true')
  })

  it('reprograma con los datos actuales y cierra con Escape sin guardar nada', async () => {
    reprogramarCita.mockResolvedValueOnce({ data: cita({ hora: '16:00' }) })
    pintar(datos({ citaciones: [cita()] }))
    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar' }))
    const dialogo = await screen.findByRole('dialog', { name: 'Reprogramar entrevista' })
    expect(within(dialogo).getByLabelText(/Hora/).value).toBe('14:30')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(reprogramarCita).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Reprogramar' }))
    const otra = await screen.findByRole('dialog')
    fireEvent.change(within(otra).getByLabelText(/Hora/), { target: { value: '16:00' } })
    fireEvent.click(within(otra).getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('La entrevista quedó reprogramada. Avisamos al aspirante.')).toBeTruthy()
    expect(reprogramarCita).toHaveBeenCalledWith(1, 3, 7, expect.objectContaining({ hora: '16:00', fecha: '2030-01-15' }))
  })

  it('cancela con motivo (mínimo 10 caracteres lo valida el servidor) y muestra las canceladas con su motivo', async () => {
    cancelarCita.mockRejectedValueOnce(falla422('motivo', 'El motivo de la cancelación debe tener al menos 10 caracteres.'))
    cancelarCita.mockResolvedValueOnce({ data: cita({ estado: 'cancelada', motivo_cancelacion: 'No hay sala disponible.' }) })
    pintar(datos({ citaciones: [cita(), cita({ id: 2, estado: 'cancelada', motivo_cancelacion: 'Cambio de jornada.', hora: '09:00' })] }))
    expect(screen.getByText('Cambio de jornada.')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Citas canceladas (1)' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar cita' }))
    const dialogo = await screen.findByRole('alertdialog')
    fireEvent.change(within(dialogo).getByLabelText(/Motivo/), { target: { value: 'corto' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))
    expect(await within(dialogo).findByText(/al menos 10 caracteres/)).toBeTruthy()
    fireEvent.change(within(dialogo).getByLabelText(/Motivo/), { target: { value: 'No hay sala disponible.' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar cita' }))
    expect(await screen.findByText('La entrevista quedó cancelada. Avisamos al aspirante.')).toBeTruthy()
    expect(cancelarCita).toHaveBeenLastCalledWith(1, 3, 7, 'No hay sala disponible.')
  })

  it('un enlace http(s) se muestra como enlace seguro y cualquier otro texto, como texto sin interpretarse', () => {
    pintar(datos({ citaciones: [cita({ lugar_o_enlace: 'https://meet.example.com/x', es_enlace: true }), cita({ id: 9, actividad: 'prueba_tecnica', actividad_etiqueta: 'Prueba técnica', lugar_o_enlace: '<img src=x onerror=alert(1)>', es_enlace: false })] }))
    const enlace = screen.getByRole('link', { name: 'https://meet.example.com/x' })
    expect(enlace.getAttribute('rel')).toBe('noopener noreferrer')
    expect(enlace.getAttribute('target')).toBe('_blank')
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeTruthy()
    expect(document.querySelector('img')).toBeNull()
  })
})
