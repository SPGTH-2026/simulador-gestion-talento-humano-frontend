import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Orientación del flujo de Selección: qué sigue, con los requisitos reales y enlaces que conservan la convocatoria y
// respetan los permisos. El servidor decide quién avanza; aquí solo se explica.
const permisos = vi.hoisted(() => ({ ver: true }))
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { role: 'instructor' }, can: (p) => (p === 'seleccion:ver' ? permisos.ver : true) }) }))
vi.mock('../../api/seleccion', () => ({
  obtenerConfiguracion: vi.fn(),
  guardarConfiguracion: vi.fn(),
  obtenerCalificaciones: vi.fn(),
  guardarCalificacion: vi.fn(),
}))

import { obtenerCalificaciones, obtenerConfiguracion } from '../../api/seleccion'
import PanelCalificaciones from './PanelCalificaciones'
import PanelConfiguracion from './PanelConfiguracion'
import PasoSiguienteSeleccion from './PasoSiguienteSeleccion'
import SinCandidatosRanking from './ranking/SinCandidatosRanking'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  permisos.ver = true
})

const enRouter = (nodo) => render(<MemoryRouter>{nodo}</MemoryRouter>)
const hrefDe = (nombre) => screen.getByRole('link', { name: nombre }).getAttribute('href')

describe('PasoSiguienteSeleccion', () => {
  it('sin actividades: una frase, Ranking como acción principal y los requisitos en la ayuda desplegable', () => {
    enRouter(<PasoSiguienteSeleccion convocatoriaId={107} modo="sin_actividades" />)

    expect(screen.getByText(/No se piden notas: revisa los documentos y elige a mano/)).toBeTruthy()
    expect(hrefDe('Ir a Ranking y finalistas')).toBe('/seleccion?convocatoria=107&pestana=ranking')
    // Los requisitos completos están en un <details> cerrado: no ocupan la pantalla pero siguen a un clic (o a Enter).
    const ayuda = screen.getByText('¿Qué necesita un candidato para quedar listo?').closest('details')
    expect(ayuda.open).toBe(false)
    expect(ayuda.textContent).toMatch(/No basta con haber cargado archivos/)
    expect(ayuda.textContent).toMatch(/referencia vigente/)
    expect(ayuda.textContent).not.toMatch(/calificadas/)
    // Sin actividades no hay notas que registrar: no se manda a los candidatos.
    expect(screen.queryByRole('link', { name: 'Ir a los candidatos' })).toBeNull()
    expect(screen.queryByText(/ya son elegibles|elegibles/)).toBeNull()
  })

  it('con actividades: pide registrar las calificaciones, con Candidatos como acción principal', () => {
    enRouter(<PasoSiguienteSeleccion convocatoriaId={108} modo="con_actividades" />)

    expect(screen.getByText(/Registra las calificaciones de cada candidato/)).toBeTruthy()
    expect(hrefDe('Ir a los candidatos')).toBe('/seleccion/preseleccion?convocatoria=108')
    expect(hrefDe('Ver Ranking y finalistas')).toBe('/seleccion?convocatoria=108&pestana=ranking')
    expect(screen.getByText('¿Qué necesita un candidato para quedar listo?').closest('details').textContent).toMatch(/todas las actividades configuradas/)
  })

  it('sin permiso para ver Selección queda el texto, sin enlaces', () => {
    permisos.ver = false
    enRouter(<PasoSiguienteSeleccion convocatoriaId={107} modo="sin_actividades" />)

    expect(screen.getByText(/elige a mano/)).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('PanelConfiguracion', () => {
  const config = (extra) => ({
    data: {
      convocatoria_id: 107, estado_convocatoria: 'en_proceso', editable: true, bloqueada: false, configurada: true,
      opcion: 'sin_actividades', entrevista: { activa: false, peso: null }, prueba_tecnica: { activa: false, peso: null },
      actualizada_por: 'Instructor Demo', ...extra,
    },
  })

  it('con la configuración guardada dice qué sigue según la modalidad', async () => {
    obtenerConfiguracion.mockResolvedValue(config())
    enRouter(<PanelConfiguracion convocatoriaId={107} activo puedeDecidir />)

    expect(await screen.findByText(/elige a mano a los finalistas/)).toBeTruthy()
    expect(hrefDe('Ir a Ranking y finalistas')).toContain('convocatoria=107')
  })

  it('con entrevista manda a registrar las calificaciones', async () => {
    obtenerConfiguracion.mockResolvedValue(config({ opcion: 'solo_entrevista', entrevista: { activa: true, peso: 100 } }))
    enRouter(<PanelConfiguracion convocatoriaId={108} activo puedeDecidir />)

    expect(await screen.findByText(/Registra las calificaciones de cada candidato/)).toBeTruthy()
  })

  it('pendiente de configurar: todavía no hay siguiente paso', async () => {
    obtenerConfiguracion.mockResolvedValue(config({ configurada: false, opcion: null }))
    enRouter(<PanelConfiguracion convocatoriaId={107} activo puedeDecidir />)

    expect(await screen.findByText('Pendiente de configurar')).toBeTruthy()
    expect(screen.queryByText('Siguiente paso')).toBeNull()
  })
})

describe('PanelCalificaciones', () => {
  const datos = (resultado, extra = {}) => ({
    data: {
      calificable: true, estado_convocatoria: 'en_proceso', estado_documental: 'habilitado',
      configuracion: { configurada: true, bloqueada: false },
      actividades: { entrevista: { activa: false, estado: 'desactivada', calificacion: null }, prueba_tecnica: { activa: false, estado: 'desactivada', calificacion: null } },
      progreso: { requeridas: 0, registradas: 0, pendientes: [], completo: false },
      resultado_adicional: resultado, ...extra,
    },
  })

  it('sin actividades ya no es un callejón: explica que no se piden notas y deja un único enlace a Ranking', async () => {
    obtenerCalificaciones.mockResolvedValue(datos({ estado: 'sin_actividades', valor: null }))
    enRouter(<PanelCalificaciones convocatoriaId={107} postulacionId={477} puedeDecidir />)

    expect(await screen.findByText(/no se piden notas/)).toBeTruthy()
    expect(hrefDe('Ir a Ranking y finalistas')).toContain('convocatoria=107')
    // No se repite el bloque «Siguiente paso» completo.
    expect(screen.queryByText('Siguiente paso')).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('sin configurar: el aviso lleva a la pestaña Configuración (solo con permiso para ver Selección)', async () => {
    obtenerCalificaciones.mockResolvedValue(
      datos({ estado: 'incompleto', valor: null }, { configuracion: { configurada: false, bloqueada: false } }),
    )
    enRouter(<PanelCalificaciones convocatoriaId={109} postulacionId={490} puedeDecidir />)

    expect(await screen.findByText(/Pendiente de configurar/)).toBeTruthy()
    expect(hrefDe('Ir a la configuración')).toBe('/seleccion/preseleccion?convocatoria=109&pestana=configuracion')

    cleanup()
    permisos.ver = false
    enRouter(<PanelCalificaciones convocatoriaId={109} postulacionId={490} puedeDecidir />)
    expect(await screen.findByText(/Pendiente de configurar/)).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('con notas pendientes avisa que no queda listo para elegirse hasta completarlas', async () => {
    obtenerCalificaciones.mockResolvedValue(
      datos(
        { estado: 'incompleto', valor: null },
        { progreso: { requeridas: 1, registradas: 0, pendientes: ['entrevista'], completo: false } },
      ),
    )
    enRouter(<PanelCalificaciones convocatoriaId={108} postulacionId={480} puedeDecidir />)

    expect(await screen.findByText(/no queda listo para elegirse como finalista/)).toBeTruthy()
  })

  it('si el candidato no está habilitado no se le pide completar notas (primero necesita la habilitación)', async () => {
    obtenerCalificaciones.mockResolvedValue(
      datos(
        { estado: 'incompleto', valor: null },
        { calificable: false, estado_documental: 'no_habilitado', progreso: { requeridas: 1, registradas: 0, pendientes: ['entrevista'], completo: false } },
      ),
    )
    enRouter(<PanelCalificaciones convocatoriaId={108} postulacionId={481} puedeDecidir />)

    expect(await screen.findByText(/Falta:/)).toBeTruthy()
    expect(screen.queryByText(/no queda listo para elegirse como finalista/)).toBeNull()
  })

  it('en solo lectura (Decidir) no ofrece el siguiente paso', async () => {
    obtenerCalificaciones.mockResolvedValue(datos({ estado: 'sin_actividades', valor: null }))
    enRouter(<PanelCalificaciones convocatoriaId={107} postulacionId={477} puedeDecidir soloLectura />)

    expect(await screen.findByText(/no se piden notas/)).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
  })
})

describe('SinCandidatosRanking', () => {
  const ctx = (modo, noListos) => ({ convocatoriaId: 107, modo, meta: { no_listos: noListos } })

  it('sin actividades dice qué puede faltar (visible) y deja la regla en la ayuda, sin hablar de notas', () => {
    enRouter(<SinCandidatosRanking {...ctx('sin_actividades', 2)} />)

    expect(screen.getByText(/Hay 2 candidatos que todavía no cumplen los requisitos/)).toBeTruthy()
    expect(screen.getByText(/Puede faltar la habilitación documental, la referencia vigente o algún documento obligatorio/)).toBeTruthy()
    expect(screen.getByText(/habilitado documentalmente/)).toBeTruthy()
    expect(screen.queryByText(/calificadas/)).toBeNull()
    expect(screen.queryByText(/alguna nota/)).toBeNull()
    expect(hrefDe('Revisar los candidatos en Preselección')).toBe('/seleccion/preseleccion?convocatoria=107')
  })

  it('con actividades añade que deben estar calificadas', () => {
    enRouter(<SinCandidatosRanking {...ctx('con_actividades', 1)} />)

    expect(screen.getByText(/Hay 1 candidato que todavía no cumple los requisitos/)).toBeTruthy()
    expect(screen.getByText(/alguna nota/)).toBeTruthy()
    expect(screen.getByText(/actividades configuradas/)).toBeTruthy()
  })
})
