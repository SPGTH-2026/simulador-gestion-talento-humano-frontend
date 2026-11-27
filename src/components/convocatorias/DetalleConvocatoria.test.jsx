import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(cleanup)

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: { role: 'aspirante' }, can: () => false }),
}))
vi.mock('../postulacion/SeccionesPostulacion', () => ({
  PestanaDatosPersonales: () => <p>contenido de datos</p>,
  PestanaDocumentos: () => <p>contenido de documentos</p>,
}))
vi.mock('./detalle/SeccionesDescripcion', () => ({ default: () => <p>contenido de descripción</p> }))

import DetalleConvocatoria from './DetalleConvocatoria'

const convocatoria = { id: 1, nombre: 'Auxiliar', estado: { codigo: 'publicada', nombre: 'Publicada' } }

describe('DetalleConvocatoria', () => {
  it('para quien se postula muestra las tres pestañas en orden', () => {
    render(<DetalleConvocatoria convocatoria={convocatoria} onVolver={() => {}} envolverPostulacion={(pestanas) => pestanas} />)

    const nombres = screen.getAllByRole('tab').map((t) => t.textContent)
    expect(nombres).toEqual(['Descripción', 'Datos personales', 'Documentos'])
  })

  it('sin postulación no hay pestañas: solo la descripción', () => {
    render(<DetalleConvocatoria convocatoria={convocatoria} onVolver={() => {}} />)

    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    expect(screen.getByText('contenido de descripción')).toBeTruthy()
  })
})
