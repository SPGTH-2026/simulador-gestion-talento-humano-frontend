import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Regresión: usePanelRanking llamaba a useObjetivoRanking con `meta`, `recargar`, `montado` y `botonCambiar` ANTES de
// declararlos («Cannot access 'meta' before initialization»), así que «Ranking y finalistas» caía al ErrorBoundary con
// cualquier convocatoria. Estas pruebas montan el panel real con la API simulada.
vi.mock('../../api/seleccion', () => ({
  rankingConvocatoria: vi.fn(),
  fijarObjetivoFinalistas: vi.fn(),
  confirmarFinalistas: vi.fn(),
}))

import ErrorBoundary from '../ErrorBoundary'
import PanelRanking from './PanelRanking'
import { confirmarFinalistas, rankingConvocatoria } from '../../api/seleccion'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  // jsdom no implementa scrollIntoView, que el panel usa para llevar el resultado de una acción a la vista.
  Element.prototype.scrollIntoView = vi.fn()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const AVISO_ERROR = /Esta pantalla tuvo un problema/i
const comparacion = {
  modo: false,
  marcas: new Map(),
  abierto: false,
  entrar: () => {},
  salir: () => {},
  abrir: () => {},
  cerrar: () => {},
  limpiar: () => {},
  quitar: () => {},
  alternar: () => {},
}
const metaBase = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 1,
  version: 'v1',
  vacantes: 1,
  postuladas: 3,
  listos: 1,
  no_listos: 2,
  objetivo: { valor: 2, configurado: false, efectivo: 1 },
  sugeridos: 0,
  empate_en_corte: null,
  lista_confirmada: null,
}
const fila = { postulacion_id: 477, aspirante: 'Func B1', posicion: null, resultado_adicional: null, cumplimiento_documental: 100, sugerencia: null, finalista: false }
const sinActividades = { data: [fila], meta: { ...metaBase, modo: 'sin_actividades' } }

const montar = (props = {}) =>
  render(
    <ErrorBoundary>
      <MemoryRouter>
        <PanelRanking convocatoriaId={107} activo enProceso puedeDecidir comparacion={comparacion} onConfirmada={() => {}} {...props} />
      </MemoryRouter>
    </ErrorBoundary>,
  )

describe('PanelRanking', () => {
  it('carga y muestra el ranking sin caer al ErrorBoundary (el fallo de «meta» antes de inicializarse)', async () => {
    rankingConvocatoria.mockResolvedValue(sinActividades)
    montar()

    expect(await screen.findByText('Func B1')).toBeTruthy()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
    expect(screen.getByText('Candidatos listos')).toBeTruthy()
  })

  it('sin actividades: se elige a mano, la justificación es obligatoria y se envía la elección', async () => {
    rankingConvocatoria.mockResolvedValue(sinActividades)
    confirmarFinalistas.mockResolvedValue({ creada: true })
    montar()

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Elegir a Func B1 como finalista' }))
    fireEvent.click(screen.getByRole('button', { name: 'Revisar y confirmar' }))

    const confirmar = await screen.findByRole('button', { name: 'Confirmar finalistas' })
    expect(confirmar.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText(/Justificación/), { target: { value: 'Elección manual sin actividades' } })
    expect(confirmar.disabled).toBe(false)
    fireEvent.click(confirmar)

    await waitFor(() =>
      expect(confirmarFinalistas).toHaveBeenCalledWith(107, {
        version: 'v1',
        postulacion_ids: [477],
        justificacion: 'Elección manual sin actividades',
      }),
    )
  })
})

describe('PanelRanking: paso a Decidir', () => {
  const conLista = {
    data: [{ ...fila, finalista: true }],
    meta: { ...metaBase, modo: 'sin_actividades', lista_confirmada: { version: 1, total: 1, requiere_revision: false, confirmada_en: '2026-11-23T20:00:00Z' } },
  }
  const hrefDecidir = () => screen.getByRole('link', { name: 'Ir a Decidir' }).getAttribute('href')

  it('con una lista confirmada ofrece «Ir a Decidir» con la convocatoria', async () => {
    rankingConvocatoria.mockResolvedValue(conLista)
    montar()

    expect(await screen.findByText(/Lista confirmada v1/)).toBeTruthy()
    expect(hrefDecidir()).toBe('/seleccion/decidir?convocatoria=107')
  })

  it('sin permiso para decidir no ofrece «Ir a Decidir»', async () => {
    rankingConvocatoria.mockResolvedValue(conLista)
    montar({ puedeDecidir: false })

    expect(await screen.findByText(/Lista confirmada v1/)).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Ir a Decidir' })).toBeNull()
  })

  it('sin lista confirmada todavía no hay enlace', async () => {
    rankingConvocatoria.mockResolvedValue(sinActividades)
    montar()

    expect(await screen.findByText('Func B1')).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Ir a Decidir' })).toBeNull()
  })

  const confirmarEleccion = async () => {
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Elegir a Func B1 como finalista' }))
    fireEvent.click(screen.getByRole('button', { name: 'Revisar y confirmar' }))
    fireEvent.change(await screen.findByLabelText(/Justificación/), { target: { value: 'Elección manual sin actividades' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar finalistas' }))
  }

  it('al confirmar una lista nueva dice que se registró una versión y ofrece «Ir a Decidir»', async () => {
    rankingConvocatoria.mockResolvedValue(sinActividades)
    confirmarFinalistas.mockResolvedValue({ creada: true })
    montar()
    await confirmarEleccion()

    expect(await screen.findByText(/Quedó registrada una nueva versión de la lista/)).toBeTruthy()
    expect(hrefDecidir()).toBe('/seleccion/decidir?convocatoria=107')
  })

  it('al confirmar una lista idéntica dice que no se creó otra versión y conserva el paso a Decidir', async () => {
    rankingConvocatoria.mockResolvedValue(sinActividades)
    confirmarFinalistas.mockResolvedValue({ creada: false })
    montar()
    await confirmarEleccion()

    expect(await screen.findByText(/no se creó una versión nueva/)).toBeTruthy()
    expect(hrefDecidir()).toBe('/seleccion/decidir?convocatoria=107')
  })
})

describe('PanelRanking: error y reintento', () => {
  it('si la primera carga falla muestra el error con «Reintentar» y se recupera', async () => {
    rankingConvocatoria.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(sinActividades)
    montar()

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Func B1')).toBeTruthy()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
  })
})

describe('PanelRanking: elegir la sugerencia', () => {
  const sugerida = { ...fila, posicion: 1, resultado_adicional: '8.00', sugerencia: 'sugerido' }
  const conActividades = (sugeridos) => ({
    data: [sugerida],
    meta: { ...metaBase, modo: 'con_actividades', sugeridos, listos: sugeridos },
  })

  it('con un solo sugerido dice «Se eligió el candidato sugerido.», sin plural', async () => {
    rankingConvocatoria.mockResolvedValue(conActividades(1))
    montar()

    fireEvent.click(await screen.findByRole('button', { name: 'Elegir la sugerencia' }))

    expect(await screen.findByText('Se eligió el candidato sugerido.')).toBeTruthy()
    expect(screen.queryByText(/Se eligieron los 1 candidatos/)).toBeNull()
  })
})

describe('PanelRanking: diálogo «Confirmar finalistas»', () => {
  it('el orden visual y el del teclado coinciden: Cancelar y después Confirmar, sin invertir con CSS', async () => {
    rankingConvocatoria.mockResolvedValue(sinActividades)
    montar()

    fireEvent.click(await screen.findByRole('checkbox', { name: 'Elegir a Func B1 como finalista' }))
    fireEvent.click(screen.getByRole('button', { name: 'Revisar y confirmar' }))

    const dialogo = await screen.findByRole('dialog')
    const botones = [...dialogo.querySelectorAll('button')].map((b) => b.textContent.trim())
    expect(botones.slice(-2)).toEqual(['Cancelar', 'Confirmar finalistas'])
    const grupo = screen.getByRole('button', { name: 'Confirmar finalistas' }).parentElement
    expect(grupo.className).not.toMatch(/reverse/)
  })
})
