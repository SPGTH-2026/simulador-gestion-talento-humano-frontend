import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BloquePostulaciones } from './BloquesAspirante'

afterEach(cleanup)
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-26T15:00:00-05:00'))
})
afterEach(() => vi.useRealTimers())

const conv = (nombre, estado, apertura = '2026-11-01', cierre = '2026-12-15') => ({
  id: nombre.length,
  nombre,
  estado: { codigo: estado },
  fecha_apertura: apertura,
  fecha_cierre: cierre,
})
const post = (id, estado, convocatoria, extra = {}) => ({
  id,
  estado: { codigo: estado, nombre: estado },
  convocatoria,
  fecha_postulacion: '2026-11-26T10:00:00Z',
  completo: false,
  ...extra,
})

const montar = (lista) =>
  render(
    <MemoryRouter>
      <BloquePostulaciones recurso={{ fase: 'listo', datos: { data: lista, meta: { last_page: 1 } } }} />
    </MemoryRouter>,
  )

describe('Inicio · Mis postulaciones', () => {
  it('muestra solo lo activo: oculta el borrador de una convocatoria cerrada y la de un proceso terminado', () => {
    montar([
      post(1, 'borrador', conv('Ingeniero de arte', 'publicada', '2026-09-01', '2026-10-23')),
      post(2, 'postulada', conv('Convocatoria de prueba Postman', 'publicada')),
      post(3, 'postulada', conv('Proceso ya terminado', 'cerrada')),
      post(4, 'borrador', conv('Auxiliar de archivo', 'publicada')),
      post(5, 'retirada', conv('Retirada por mí', 'publicada')),
    ])

    expect(screen.getByText('Convocatoria de prueba Postman')).toBeTruthy()
    expect(screen.getByText('Auxiliar de archivo')).toBeTruthy()
    expect(screen.queryByText('Ingeniero de arte')).toBeNull()
    expect(screen.queryByText('Proceso ya terminado')).toBeNull()
    expect(screen.queryByText('Retirada por mí')).toBeNull()
    expect(screen.queryByText(/ya cerró/i)).toBeNull()
  })

  it('los borradores activos van primero y tienen su acción para continuar', () => {
    montar([post(1, 'postulada', conv('Enviada', 'publicada')), post(2, 'borrador', conv('Por completar', 'publicada'))])

    const titulos = screen.getAllByRole('link').map((a) => a.textContent)
    expect(titulos.indexOf('Por completar')).toBeLessThan(titulos.indexOf('Enviada'))
    expect(screen.getByRole('link', { name: 'Continuar postulación' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ver documentos' })).toBeTruthy()
  })

  it('sin nada activo muestra el mensaje de vacío, no postulaciones viejas', () => {
    montar([post(1, 'borrador', conv('Cerrada hace tiempo', 'publicada', '2026-09-01', '2026-10-23'))])

    expect(screen.getByText(/no tienes postulaciones activas/i)).toBeTruthy()
    expect(screen.queryByText('Cerrada hace tiempo')).toBeNull()
    expect(screen.getByRole('link', { name: /ver todas mis postulaciones/i })).toBeTruthy()
  })
})
