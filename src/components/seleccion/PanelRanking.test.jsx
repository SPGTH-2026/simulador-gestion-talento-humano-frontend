import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PanelRanking from './PanelRanking'
import * as api from '../../api/seleccion'

vi.mock('../../api/seleccion', () => ({
  rankingConvocatoria: vi.fn(),
  fijarObjetivoFinalistas: vi.fn(),
  confirmarFinalistas: vi.fn(),
}))

const comparacion = {
  modo: false,
  marcas: new Map(),
  entrar: () => {},
  salir: () => {},
  abrir: () => {},
  limpiar: () => {},
  quitar: () => {},
  alternar: () => {},
}

const respuestaRanking = {
  data: [
    { postulacion_id: 11, aspirante: 'Ana Pérez', posicion: 1, cumplimiento_documental: 'completo', resultado_adicional: null, finalista: false, sugerencia: true },
    { postulacion_id: 12, aspirante: 'Luis Gómez', posicion: 2, cumplimiento_documental: 'completo', resultado_adicional: null, finalista: false, sugerencia: false },
  ],
  meta: {
    version: 'v1',
    modo: 'sin_actividades',
    current_page: 1,
    last_page: 1,
    total: 2,
    listos: 2,
    no_listos: 0,
    postuladas: 2,
    pendientes: 0,
    sugeridos: 1,
    vacantes: 1,
    estado_convocatoria: 'en_proceso',
    evaluador_visible: false,
    skills_requeridas: 0,
    actividades: [],
    objetivo: { valor: 2, efectivo: 2, configurado: true },
    lista: null,
  },
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('PanelRanking (props de sus secciones)', () => {
  it('muestra los candidatos del ranking que llegan del servidor', async () => {
    api.rankingConvocatoria.mockResolvedValue(respuestaRanking)

    render(<PanelRanking convocatoriaId={5} activo enProceso puedeDecidir={false} comparacion={comparacion} onConfirmada={() => {}} />)

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeTruthy())
    expect(screen.getByText('Luis Gómez')).toBeTruthy()
    expect(api.rankingConvocatoria).toHaveBeenCalledWith(5, { page: 1 })
  })

  it('muestra el error con su botón de reintentar cuando no carga el ranking', async () => {
    api.rankingConvocatoria.mockRejectedValue(new Error('Sin conexión'))

    render(<PanelRanking convocatoriaId={5} activo enProceso puedeDecidir={false} comparacion={comparacion} onConfirmada={() => {}} />)

    await waitFor(() => expect(screen.getByText(/No pudimos conectarnos/)).toBeTruthy())
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeTruthy()
  })
})
