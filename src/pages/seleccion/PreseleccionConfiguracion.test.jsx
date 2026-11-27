import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

// Regresión: con una convocatoria sin configurar, el aviso del detalle del candidato lleva a Configuración. Debe cerrar el
// detalle (era un modal que se quedaba encima), conservar la convocatoria, activar la pestaña y dejar el foco en ella.
vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { role: 'super_admin' }, can: () => true }),
}))
vi.mock('../../api/seleccion', () => ({
  listaConvocatoriasSeleccion: vi.fn(),
  candidatosConvocatoria: vi.fn(),
  obtenerConfiguracion: vi.fn(),
  obtenerCalificaciones: vi.fn(),
  guardarConfiguracion: vi.fn(),
}))

import { candidatosConvocatoria, listaConvocatoriasSeleccion, obtenerCalificaciones, obtenerConfiguracion } from '../../api/seleccion'
import Preseleccion from './Preseleccion'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  Element.prototype.scrollIntoView = vi.fn()
})

const convocatoria = { id: 109, nombre: 'Prueba sin configurar', codigo: 'COD-109', vacantes: 1, estado: { codigo: 'en_proceso', nombre: 'En proceso' }, candidatos: 1 }

function Ubicacion() {
  const l = useLocation()
  return <output data-testid="ubicacion">{l.pathname + l.search}</output>
}

describe('Preselección: del detalle del candidato a Configuración', () => {
  it('cierra el detalle, conserva la convocatoria, activa Configuración y enfoca la pestaña', async () => {
    listaConvocatoriasSeleccion.mockResolvedValue({ data: [convocatoria], meta: { current_page: 1, last_page: 1, per_page: 20, total: 1 } })
    candidatosConvocatoria.mockResolvedValue({
      data: [{ id: 490, aspirante: 'Func B1', estado_documental: 'habilitado', cumplimiento: 100 }],
      meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
    })
    const configuracion = {
      convocatoria_id: 109, estado_convocatoria: 'en_proceso', editable: true, bloqueada: false, configurada: false,
      opcion: null, entrevista: { activa: false, peso: null }, prueba_tecnica: { activa: false, peso: null },
    }
    obtenerConfiguracion.mockResolvedValue({ data: configuracion })
    obtenerCalificaciones.mockResolvedValue({
      data: {
        calificable: true, estado_convocatoria: 'en_proceso', estado_documental: 'habilitado',
        configuracion: { configurada: false, bloqueada: false },
        actividades: { entrevista: { activa: false, estado: 'desactivada', calificacion: null }, prueba_tecnica: { activa: false, estado: 'desactivada', calificacion: null } },
        progreso: { requeridas: 0, registradas: 0, pendientes: [], completo: false },
        resultado_adicional: { estado: 'incompleto', valor: null },
      },
    })

    render(
      <MemoryRouter initialEntries={['/seleccion/preseleccion?convocatoria=109']}>
        <Preseleccion />
        <Ubicacion />
      </MemoryRouter>,
    )

    // Abre el detalle del candidato y pulsa el enlace del aviso.
    fireEvent.click(await screen.findByRole('button', { name: /Abrir el detalle de Func B1/ }, { timeout: 5000 }))
    const enlace = await screen.findByRole('link', { name: 'Ir a la configuración' }, { timeout: 5000 })
    expect(screen.getByRole('dialog')).toBeTruthy()
    fireEvent.click(enlace)

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 5000 })
    // Conserva la convocatoria y activa Configuración.
    expect(screen.getByTestId('ubicacion').textContent).toBe('/seleccion/preseleccion?convocatoria=109&pestana=configuracion')
    const pestana = screen.getByRole('tab', { name: 'Configuración' })
    expect(pestana.getAttribute('aria-selected')).toBe('true')
    // El foco queda en un lugar útil: la pestaña activa, no en la nada.
    await waitFor(() => expect(document.activeElement).toBe(pestana), { timeout: 5000 })
    // Y el panel de configuración es el visible.
    expect(await screen.findByText('Pendiente de configurar', {}, { timeout: 5000 })).toBeTruthy()
  })
})
