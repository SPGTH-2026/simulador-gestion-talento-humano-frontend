import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EstadoCandidato from './EstadoCandidato'
import { describirBloqueos } from '../../lib/bloqueosSeleccion'

afterEach(cleanup)

const montar = (fila, props = {}) => {
  const onResolver = vi.fn()
  render(
    <MemoryRouter>
      <EstadoCandidato fila={fila} convocatoriaId={109} puedeDecidir puedeDesignar onResolver={onResolver} {...props} />
    </MemoryRouter>,
  )
  return onResolver
}

describe('EstadoCandidato', () => {
  it('un candidato listo se rotula «Listo para elegir», no «Seleccionado»', () => {
    montar({ listo: true, bloqueos: [] })

    expect(screen.getByText('Listo para elegir')).toBeTruthy()
    expect(screen.getByText('como finalista').className).toContain('sr-only')
    expect(screen.queryByText(/Seleccionado/)).toBeNull()
  })

  it('un solo bloqueo va en una línea, con su acción si el permiso la permite', () => {
    const onResolver = montar({ listo: false, bloqueos: [{ codigo: 'referencia_requerida' }] })

    expect(screen.getByText(/falta designar la referencia/)).toBeTruthy()
    expect(document.querySelector('details')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Designar referencia' }))
    expect(onResolver).toHaveBeenCalledWith('referencia')
  })

  it('sin permiso para designar o decidir no ofrece acciones, solo la explicación', () => {
    montar({ listo: false, bloqueos: [{ codigo: 'referencia_invalidada' }] }, { puedeDesignar: false, puedeDecidir: false })
    expect(screen.getByText(/quedó invalidada/)).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()

    cleanup()
    montar({ listo: false, bloqueos: [{ codigo: 'notas_pendientes', actividades: ['entrevista'] }] }, { puedeDecidir: false })
    expect(screen.getByText('Faltan las notas de entrevista.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('configuración pendiente lleva a Configuración conservando la convocatoria (solo a quien puede decidir)', () => {
    montar({ listo: false, bloqueos: [{ codigo: 'configuracion_pendiente' }] })
    expect(screen.getByRole('link', { name: 'Ir a la configuración' }).getAttribute('href')).toBe(
      '/seleccion/preseleccion?convocatoria=109&pestana=configuracion',
    )

    cleanup()
    montar({ listo: false, bloqueos: [{ codigo: 'configuracion_pendiente' }] }, { puedeDecidir: false })
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('varios bloqueos: resumen con «y N más» y el detalle ampliable con todos', () => {
    montar({
      listo: false,
      bloqueos: [
        { codigo: 'documentos_obligatorios', faltantes: [{ codigo: 'hv', nombre: 'Hoja de vida' }, { codigo: 'id', nombre: 'Documento de identidad' }] },
        { codigo: 'no_habilitado' },
        { codigo: 'notas_pendientes', actividades: ['entrevista', 'prueba_tecnica'] },
      ],
    })

    const detalle = document.querySelector('details')
    expect(detalle.open).toBe(false)
    expect(screen.getByText('Faltan 2 documentos obligatorios')).toBeTruthy()
    expect(screen.getByText('y 2 más')).toBeTruthy()
    // El detalle enumera cada uno, con los nombres reales de los documentos.
    expect(detalle.textContent).toContain('Faltan documentos obligatorios: Hoja de vida y Documento de identidad.')
    expect(detalle.textContent).toContain('El resultado documental no lo habilita.')
    expect(detalle.textContent).toContain('Faltan las notas de entrevista y prueba técnica.')
  })

  it('las notas solo se ofrecen para registrar si el candidato no tiene un bloqueo documental', () => {
    montar({ listo: false, bloqueos: [{ codigo: 'notas_pendientes', actividades: ['entrevista'] }] })
    expect(screen.getByRole('button', { name: 'Registrar notas' })).toBeTruthy()

    cleanup()
    montar({ listo: false, bloqueos: [{ codigo: 'no_habilitado' }, { codigo: 'notas_pendientes', actividades: ['entrevista'] }] })
    expect(screen.queryByRole('button', { name: 'Registrar notas' })).toBeNull()
  })

  it('no inventa motivos: sin bloqueos del servidor o con códigos desconocidos no dice nada', () => {
    montar({ listo: false })
    expect(document.body.textContent).toBe('')

    cleanup()
    montar({ listo: false, bloqueos: [{ codigo: 'algo_nuevo' }] })
    expect(document.body.textContent).toBe('')
    expect(describirBloqueos([{ codigo: 'algo_nuevo' }], {})).toEqual([])
  })
})
