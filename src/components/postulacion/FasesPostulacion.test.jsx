import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(cleanup)

vi.mock('./SeccionDocumentosRequeridos', () => ({ default: () => <p>lista de documentos</p> }))
vi.mock('./SeccionSkills', () => ({ default: () => null }))
vi.mock('./SeccionAdicionales', () => ({ default: () => null }))
vi.mock('./SeccionEnviarPostulacion', () => ({ default: () => null }))
vi.mock('./IndicadorCompletitud', () => ({ default: () => null }))

import { ContextoPostulacion } from './contextoPostulacion'
import { PestanaDocumentos } from './SeccionesPostulacion'

// Panel mínimo: lo que PestanaDocumentos lee del estado de la postulación.
const panel = (vista, extra = {}) => ({
  asegurar: vi.fn(),
  editable: true,
  esBorrador: vista.postulacion?.estado?.codigo === 'borrador',
  esRetirada: false,
  puedeVolver: false,
  motivoVolver: '',
  recargar: vi.fn(),
  setError: vi.fn(),
  vista,
  ...extra,
})

function montar(vista, props = {}, { listo = true, panelExtra = {} } = {}) {
  const irA = vi.fn()
  render(
    <ContextoPostulacion.Provider value={{ pantalla: null, panel: panel(vista, panelExtra), datos: { listo }, props: { irA, ...props } }}>
      <PestanaDocumentos />
    </ContextoPostulacion.Provider>,
  )
  return irA
}

describe('fases de la postulación (pestañas)', () => {
  it('sin datos autorizados, Documentos queda bloqueada y lleva de vuelta a Datos personales', () => {
    const irA = montar({ postulacion: { id: null, estado: { codigo: null } }, documentos: [] })

    expect(screen.getByText('Primero tus datos personales')).toBeTruthy()
    expect(screen.queryByText('lista de documentos')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /ir a datos personales/i }))
    expect(irA).toHaveBeenCalledWith('datos')
  })

  it('un borrador sin datos también queda bloqueado', () => {
    montar({ postulacion: { id: 4, estado: { codigo: 'borrador' } }, datos_personales: { completo: false }, documentos: [] })

    expect(screen.getByText('Primero tus datos personales')).toBeTruthy()
  })

  it('con los datos guardados se abre Documentos y ofrece la flecha de regreso', () => {
    const irA = montar({ postulacion: { id: 4, estado: { codigo: 'borrador' } }, datos_personales: { completo: true }, documentos: [] })

    expect(screen.getByText('lista de documentos')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /datos personales/i }))
    expect(irA).toHaveBeenCalledWith('datos')
  })

  it('con los datos guardados pero el formulario incompleto o con cambios sin guardar, Documentos sigue bloqueada', () => {
    const irA = montar(
      { postulacion: { id: 4, estado: { codigo: 'borrador' } }, datos_personales: { completo: true }, documentos: [] },
      {},
      { listo: false },
    )

    expect(screen.getByText('Primero tus datos personales')).toBeTruthy()
    expect(screen.queryByText('lista de documentos')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /ir a datos personales/i }))
    expect(irA).toHaveBeenCalledWith('datos')
  })

  it('volver a postularse queda bloqueado si los datos no están completos y guardados', () => {
    const vista = { postulacion: { id: 9, estado: { codigo: 'retirada' } }, datos_personales: { completo: true }, documentos: [] }
    const extra = { esRetirada: true, puedeVolver: true, motivoVolver: '', volverAPostularme: vi.fn() }
    montar(vista, {}, { listo: false, panelExtra: extra })

    const boton = screen.getByRole('button', { name: /volver a postularme/i })
    expect(boton.disabled).toBe(true)
    expect(screen.getByText(/completa y autoriza tus datos personales para volver a postularte/i)).toBeTruthy()
  })

  it('con los datos listos, volver a postularse se habilita', () => {
    const vista = { postulacion: { id: 9, estado: { codigo: 'retirada' } }, datos_personales: { completo: true }, documentos: [] }
    const extra = { esRetirada: true, puedeVolver: true, motivoVolver: '', volverAPostularme: vi.fn() }
    montar(vista, {}, { listo: true, panelExtra: extra })

    expect(screen.getByRole('button', { name: /volver a postularme/i }).disabled).toBe(false)
  })

  it('una postulación ya enviada sin datos (anterior a este paso) sigue mostrando sus documentos', () => {
    montar({ postulacion: { id: 9, estado: { codigo: 'postulada' } }, datos_personales: { completo: false }, documentos: [] })

    expect(screen.getByText('lista de documentos')).toBeTruthy()
  })

  it('en la pantalla apilada (sin irA) no se bloquea ni hay flecha', () => {
    montar({ postulacion: { id: null, estado: { codigo: null } }, documentos: [] }, { irA: undefined })

    expect(screen.getByText('lista de documentos')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /datos personales/i })).toBeNull()
  })
})
