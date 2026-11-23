import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Regresión del refactor: los hooks useEvaluacionEvaluar y useVistaDocumentos devuelven la propia pantalla (un elemento de
// React) mientras cargan, y las vistas la trataban como contexto. El resultado era el ErrorBoundary en cuanto se abría
// «Evaluación individual» o «Documentos / Corregir documentos». Cada prueba atraviesa el estado de carga y exige el contenido.
vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ user: { id: 1, role: 'aspirante' } }) }))
vi.mock('../hooks/useConfirmacion', () => ({ useConfirmacion: () => vi.fn() }))
vi.mock('../api/evaluaciones', () => ({ obtenerEvaluacion: vi.fn(), guardarEvaluacion: vi.fn() }))
vi.mock('../api/documentos', () => ({ listaDocumentos: vi.fn() }))
vi.mock('../api/postulacionesDocumentos', () => ({
  estadoDocumentos: vi.fn(),
  obtenerPerfil: vi.fn(),
  obtenerCorreccion: vi.fn(),
  enviarCorreccion: vi.fn(),
  abrirArchivoEnPestana: vi.fn(),
  mensajeErrorBlob: vi.fn(),
}))

import ErrorBoundary from '../components/ErrorBoundary'
import { obtenerEvaluacion } from '../api/evaluaciones'
import { listaDocumentos } from '../api/documentos'
import { estadoDocumentos, obtenerCorreccion, obtenerPerfil } from '../api/postulacionesDocumentos'
import EvaluacionEvaluar from './evaluacion/EvaluacionEvaluar'
import DocumentosPostulacion from './aspirante/DocumentosPostulacion'

afterEach(cleanup)

const AVISO_ERROR = /Esta pantalla tuvo un problema/i

function abrir(ruta, camino, elemento) {
  return render(
    <ErrorBoundary>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path={camino} element={elemento} />
        </Routes>
      </MemoryRouter>
    </ErrorBoundary>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('pantallas que atraviesan el estado de carga', () => {
  it('Evaluación individual muestra la carga y luego el contenido, sin ErrorBoundary', async () => {
    obtenerEvaluacion.mockResolvedValue({
      data: {
        id: 9,
        correccion: null,
        estado: 'Postulada',
        aspirante: { id: 3, name: 'Aspirante Prueba', email: 'a@test.com' },
        convocatoria: { id: 4, titulo: 'Convocatoria de prueba', estado: 'publicada' },
        documentos: { total: 1, cargados: 1 },
        skills: [],
        evaluacion: null,
      },
    })
    listaDocumentos.mockResolvedValue({
      data: [{ id: 10, nombre: 'Documento de identidad', obligatorio: true, estado: 'subido', archivo: { id: 1, nombre_original: 'a.pdf' } }],
    })

    abrir('/evaluacion/evaluar/9', '/evaluacion/evaluar/:postulacionId', <EvaluacionEvaluar />)

    expect(screen.getByText(/Cargando/i)).toBeTruthy()
    expect(await screen.findByText('Aspirante Prueba')).toBeTruthy()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
  })

  // Postulación sin skills ni adicionales, con una ronda de corrección vigente sobre el documento de identidad.
  function prepararDocumentos() {
    estadoDocumentos.mockResolvedValue({
      postulacion: { id: 5, user_id: 1, estado: { codigo: 'postulada', nombre: 'Postulada' } },
      convocatoria: { id: 4, nombre: 'Convocatoria de prueba' },
      ventana: 'abierta',
      editable: true,
      completo: true,
      requiere_sexo: false,
      sexo: null,
      documentos: [
        {
          id: 1,
          parametro: { id: 10, codigo: 'doc-identidad', nombre: 'Documento de identidad' },
          obligatorio: true,
          estado: 'subido',
          archivo: { id: 1, nombre_original: 'a.pdf', tamano_bytes: 1024, subido_en: '2026-11-22T10:00:00Z' },
        },
      ],
      adicionales: [],
      skills: [],
      skills_convocatoria: [],
    })
    obtenerPerfil.mockResolvedValue({ sexo: null })
    obtenerCorreccion.mockResolvedValue({
      correccion: {
        ordinarias_max: 2,
        historial: [],
        ronda_actual: {
          id: 1,
          tipo: 'ordinaria',
          numero: 1,
          estado: 'vigente',
          fecha_limite: '2026-11-25T15:00:00Z',
          observaciones: 'Reemplaza el documento.',
          documentos_marcados: [10],
          documentos_reemplazados: [],
        },
      },
    })

  }

  it('Corregir documentos muestra la carga y luego el contenido, sin ErrorBoundary', async () => {
    prepararDocumentos()

    abrir('/postulaciones/5/correcciones', '/postulaciones/:id/correcciones', <DocumentosPostulacion soloCorreccion />)

    expect(screen.getByText('Corregir documentos')).toBeTruthy()
    expect(screen.getAllByText(/Cargando/i).length).toBeGreaterThan(0)
    expect(await screen.findByText('Documentos requeridos')).toBeTruthy()
    expect(screen.getByText('Documento de identidad')).toBeTruthy()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
  })

  it('Documentos de la postulación (vista completa) atraviesa la carga sin skills y sin ErrorBoundary', async () => {
    prepararDocumentos()

    abrir('/postulaciones/5/documentos', '/postulaciones/:id/documentos', <DocumentosPostulacion />)

    expect(screen.getByText('Documentos de la postulación')).toBeTruthy()
    expect(await screen.findByText('Documentos requeridos')).toBeTruthy()
    // La convocatoria no pide skills: la sección no se pinta (antes reventaba al desestructurar null).
    expect(screen.queryByText('Skills')).toBeNull()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
  })
})
