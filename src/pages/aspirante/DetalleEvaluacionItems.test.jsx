import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

afterEach(cleanup)
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { id: 1, role: 'aspirante' }, can: () => true }) }))

import { DetalleEvaluacion } from './PiezasMisEvaluaciones'

const evaluacion = {
  id: 1,
  postulacion_id: 9,
  estado: 'correccion_solicitada',
  cumplimiento: 65,
  puntaje_total: '65.00',
  observaciones: 'hay campos que estan borrosos',
  perfil: {
    'doc-1': false,
    'docitem-1-0': true,
    'docitem-1-1': false,
    'docitem-1-2': true,
    'docitem-1-3': false,
    'docitem-2-0': true,
    'docitem-2-1': true,
  },
  aspirante: { name: 'Aspirante Parcial' },
  convocatoria: { titulo: 'Prueba' },
  correccion: { ronda_actual: null },
  criterios: [],
  documentos_actualizados: [],
}
const documentos = [
  { id: 'doc-1', nombre: 'Hoja de vida', estado: 'subido', ponderacion: 40, items: ['Datos completos', 'Firmada', 'Con fecha', 'Sin tachones'] },
  { id: 'doc-2', nombre: 'Documento de identidad', estado: 'subido', ponderacion: 30, items: ['Legible', 'Vigente'] },
  { id: 'doc-3', nombre: 'Certificados laborales', estado: 'subido', ponderacion: 10, items: [] },
]

describe('DetalleEvaluacion: puntos del checklist que no cumplió', () => {
  it('lista los ítems marcados «No cumple» del documento y nada de los que cumplen', () => {
    render(
      <MemoryRouter>
        <DetalleEvaluacion evaluacion={evaluacion} documentos={documentos} estadoDocumentos="listo" onCerrar={() => {}} />
      </MemoryRouter>,
    )

    expect(screen.getAllByText('Puntos que no cumplió:')).toHaveLength(1)
    expect(screen.getByText('Firmada')).toBeTruthy()
    expect(screen.getByText('Sin tachones')).toBeTruthy()
    expect(screen.queryByText('Datos completos')).toBeNull()
    expect(screen.queryByText('Legible')).toBeNull()
  })
})
