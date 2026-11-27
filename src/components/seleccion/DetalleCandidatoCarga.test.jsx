import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// La carga del detalle ocurre UNA vez. Antes, al llegar las citaciones aparecía la pestaña «Citaciones», el árbol cambiaba de
// «contenido suelto» a «pestañas» y las calificaciones se desmontaban y volvían a pedirse (skeleton otra vez 1–2 s después).
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { role: 'aprendiz_general' }, can: () => true }) }))
vi.mock('../../api/seleccion', () => ({ obtenerCalificaciones: vi.fn(), guardarCalificacion: vi.fn() }))
vi.mock('../../api/citaciones', () => ({
  citacionesDeCandidato: vi.fn(), programarCita: vi.fn(), reprogramarCita: vi.fn(), cancelarCita: vi.fn(), misCitaciones: vi.fn(),
}))

import { citacionesDeCandidato } from '../../api/citaciones'
import { obtenerCalificaciones } from '../../api/seleccion'
import DetalleCandidato from './DetalleCandidato'
import EsqueletoCalificaciones from './EsqueletoCalificaciones'

const diferida = () => {
  let resolver
  const promesa = new Promise((res) => { resolver = res })
  return { promesa, resolver }
}
const calificaciones = (extra = {}) => ({
  data: {
    configuracion: { configurada: true }, estado_convocatoria: 'en_proceso', estado_documental: 'habilitado', calificable: true,
    progreso: { registradas: 1, requeridas: 2, pendientes: ['prueba_tecnica'] },
    resultado_adicional: { estado: 'incompleto', valor: null },
    actividades: {
      entrevista: { estado: 'registrada', peso: 50, calificacion: null },
      prueba_tecnica: { estado: 'pendiente', peso: 50, calificacion: null },
    },
    ...extra,
  },
})
const citas = { data: { actividades: [{ id: 'entrevista', etiqueta: 'Entrevista' }], razon: null, citaciones: [] } }
const fila = (id, aspirante) => ({ id, aspirante, estado_documental: 'habilitado', cumplimiento: 80 })
const pintar = (f = fila(5, 'Ana Uno')) =>
  render(
    <MemoryRouter>
      <DetalleCandidato convocatoriaId={2} fila={f} puedeDecidir puedeDesignar={false} onCerrar={() => {}} onCambio={() => {}} />
    </MemoryRouter>,
  )
const cargando = () => screen.queryByText('Cargando calificaciones…')

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('Detalle del candidato: una sola carga', () => {
  it('cuando llegan las citaciones y aparece su pestaña, las calificaciones no se piden ni se vacían otra vez', async () => {
    const c = diferida()
    obtenerCalificaciones.mockResolvedValue(calificaciones())
    citacionesDeCandidato.mockReturnValue(c.promesa)
    pintar()

    expect(cargando()).toBeTruthy()
    await waitFor(() => expect(screen.getByText('1 de 2')).toBeTruthy())
    expect(cargando()).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Citaciones' })).toBeNull() // aún sin citaciones: una sola sección, sin barra

    await act(async () => c.resolver(citas))
    expect(await screen.findByRole('tab', { name: 'Citaciones' })).toBeTruthy()
    // Las notas siguen a la vista, sin skeleton intermedio, y se pidieron una sola vez.
    expect(screen.getByText('1 de 2')).toBeTruthy()
    expect(cargando()).toBeNull()
    expect(obtenerCalificaciones).toHaveBeenCalledTimes(1)
    expect(citacionesDeCandidato).toHaveBeenCalledTimes(1)
  })

  it('un solo anuncio de carga y los bloques reales a la vista mientras se esperan las notas', () => {
    obtenerCalificaciones.mockReturnValue(new Promise(() => {}))
    citacionesDeCandidato.mockReturnValue(new Promise(() => {}))
    pintar()
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByText('Cargando calificaciones…').closest('[role="status"]').getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText('Progreso')).toBeTruthy()
    expect(screen.getByText('Resultado adicional')).toBeTruthy()
  })

  it('sin configuración conocida el esqueleto es neutral: no inventa nombres de actividad', () => {
    const { container } = render(<EsqueletoCalificaciones />)
    expect(screen.queryByText('Entrevista')).toBeNull()
    expect(screen.queryByText('Prueba técnica')).toBeNull()
    expect(container.querySelectorAll('li')).toHaveLength(2)
  })

  it('con la configuración conocida muestra solo las actividades activas, con su nombre', () => {
    const { container } = render(<EsqueletoCalificaciones actividades={['prueba_tecnica']} />)
    expect(screen.getByText('Prueba técnica')).toBeTruthy()
    expect(screen.queryByText('Entrevista')).toBeNull()
    expect(container.querySelectorAll('li')).toHaveLength(1)
  })

  it('actualizar la misma información no la sustituye por el esqueleto', async () => {
    obtenerCalificaciones.mockResolvedValue(calificaciones())
    citacionesDeCandidato.mockResolvedValue(citas)
    const { rerender } = pintar()
    await screen.findByText('1 de 2')
    const nueva = diferida()
    obtenerCalificaciones.mockReturnValueOnce(nueva.promesa)
    // La fila viva cambia (p. ej. tras guardar una referencia): mismo candidato, misma clave.
    rerender(
      <MemoryRouter>
        <DetalleCandidato convocatoriaId={2} fila={{ ...fila(5, 'Ana Uno'), cumplimiento: 90 }} puedeDecidir puedeDesignar={false} onCerrar={() => {}} onCambio={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByText('1 de 2')).toBeTruthy()
    expect(cargando()).toBeNull()
  })

  it('al abrir a otro candidato no se ven datos del anterior aunque la respuesta vieja llegue tarde', async () => {
    const vieja = diferida()
    const nueva = diferida()
    obtenerCalificaciones.mockImplementation((_c, p) => (p === 5 ? vieja.promesa : nueva.promesa))
    citacionesDeCandidato.mockResolvedValue(citas)
    const ver = (f) => (
      <MemoryRouter>
        <DetalleCandidato key={f.id} convocatoriaId={2} fila={f} puedeDecidir puedeDesignar={false} onCerrar={() => {}} onCambio={() => {}} />
      </MemoryRouter>
    )
    const { rerender } = render(ver(fila(5, 'Ana Uno')))
    rerender(ver(fila(6, 'Bea Dos')))
    expect(screen.getByRole('heading', { name: 'Bea Dos' })).toBeTruthy()
    // Llega tarde la respuesta del candidato anterior: no se pinta en el nuevo.
    await act(async () => vieja.resolver(calificaciones({ progreso: { registradas: 2, requeridas: 2, pendientes: [] } })))
    expect(screen.queryByText('2 de 2')).toBeNull()
    expect(cargando()).toBeTruthy()
    await act(async () => nueva.resolver(calificaciones()))
    expect(await screen.findByText('1 de 2')).toBeTruthy()
    expect(within(screen.getByRole('dialog')).queryByText('2 de 2')).toBeNull()
  })
})
