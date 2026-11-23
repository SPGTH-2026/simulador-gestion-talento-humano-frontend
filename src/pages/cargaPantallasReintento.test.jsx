import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Regresión del refactor (mismo patrón que cargaPantallas.test.jsx): Portafolio y PanelReferencia reciben de su hook la propia
// pantalla (un elemento) o null mientras cargan, fallan o no están abiertos, y las vistas esperaban el contexto. Cada prueba
// atraviesa esos estados y exige el contenido, sin ErrorBoundary, y donde hay «Reintentar» comprueba que se recupera.
vi.mock('../api/portafolios', () => ({
  obtenerPortafolio: vi.fn(),
  estadoRevision: vi.fn(),
  descargarDocumentoRevision: vi.fn(),
  descargarCertificadoRevision: vi.fn(),
}))
vi.mock('../api/seleccion', () => ({ obtenerReferencia: vi.fn(), designarReferencia: vi.fn() }))

import ErrorBoundary from '../components/ErrorBoundary'
import PanelReferencia from '../components/seleccion/PanelReferencia'
import { obtenerPortafolio } from '../api/portafolios'
import { obtenerReferencia } from '../api/seleccion'
import Portafolio from './documentos/Portafolio'

const AVISO_ERROR = /Esta pantalla tuvo un problema/i
afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const portafolio = {
  usuario: { id: 3, name: 'Aspirante Prueba', email: 'a@test.com', ficha: { codigo: '3173334' } },
  postulaciones: [],
}
const referencia = { evaluaciones: [], referencia: null, estado_documental: 'habilitado', cumplimiento: 100 }

function abrir(elemento) {
  return render(
    <ErrorBoundary>
      <MemoryRouter initialEntries={['/documentos/3']}>
        <Routes>
          <Route path="/documentos/:userId" element={elemento} />
        </Routes>
      </MemoryRouter>
    </ErrorBoundary>,
  )
}

describe('Portafolio', () => {
  it('muestra la carga y luego el contenido, sin ErrorBoundary', async () => {
    obtenerPortafolio.mockResolvedValue(portafolio)
    abrir(<Portafolio userId="3" />)

    expect(screen.getByText(/Cargando portafolio/i)).toBeTruthy()
    expect(await screen.findByText('Portafolio de Aspirante Prueba')).toBeTruthy()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
  })

  it('si la carga falla muestra el error y «Reintentar» recupera el contenido', async () => {
    obtenerPortafolio.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(portafolio)
    abrir(<Portafolio userId="3" />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Portafolio de Aspirante Prueba')).toBeTruthy()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
  })
})

describe('PanelReferencia', () => {
  it('sin abrir la pestaña no pinta nada y no revienta', () => {
    const { container } = abrir(<PanelReferencia convocatoriaId={4} postulacionId={9} activo={false} />)
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
    expect(container.textContent).toBe('')
    expect(obtenerReferencia).not.toHaveBeenCalled()
  })

  it('al abrirla muestra la carga y luego el contenido, sin ErrorBoundary', async () => {
    obtenerReferencia.mockResolvedValue({ data: referencia })
    abrir(<PanelReferencia convocatoriaId={4} postulacionId={9} activo />)

    expect(screen.getByText(/Cargando evaluaciones/i)).toBeTruthy()
    expect(await screen.findByText(/Habilitado/i)).toBeTruthy()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
  })

  it('si la carga falla muestra el error y «Reintentar» recupera el contenido', async () => {
    obtenerReferencia.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce({ data: referencia })
    abrir(<PanelReferencia convocatoriaId={4} postulacionId={9} activo />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText(/Habilitado/i)).toBeTruthy()
    expect(screen.queryByText(AVISO_ERROR)).toBeNull()
  })
})
