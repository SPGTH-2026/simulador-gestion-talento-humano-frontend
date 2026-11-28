import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import EtapaDocumentos from './EtapaDocumentos'
import { ETIQUETAS_DOCUMENTO, etiquetasDocumento } from '../../../lib/documentosConvocatoria'

afterEach(cleanup)

// Regla vigente: todo documento que el gestor selecciona queda obligatorio para el aspirante. La pantalla debe decir lo
// mismo que el sistema.
const ctx = {
  agregarDocumentoCatalogo: vi.fn(),
  bloquearDocumentos: false,
  documentosBloqueados: false,
  documentosObligatorios: [{ id: 1, codigo: 'hoja_de_vida', nombre: 'Hoja de vida' }],
  documentosOpcionales: [{ id: 6, codigo: 'tarjeta_profesional', nombre: 'Tarjeta profesional' }],
  errorDe: () => '',
  errorDocumento: '',
  filaDocumento: (d) => <p key={d.id}>{d.nombre}</p>,
  guardandoDocumento: false,
  mostrarNuevoDocumento: false,
  nuevoDocumento: '',
  repartirPonderaciones: vi.fn(),
  repartoAuto: true,
  setErrorDocumento: vi.fn(),
  setMostrarNuevoDocumento: vi.fn(),
  setNuevoDocumento: vi.fn(),
  sumaPonderaciones: () => 100,
}

describe('ayuda del paso Documentos del asistente', () => {
  it('dice que los documentos que selecciona el gestor también son obligatorios', () => {
    render(<EtapaDocumentos ctx={ctx} />)

    expect(screen.getByText(/Los cuatro documentos básicos se incluyen siempre/)).toBeTruthy()
    expect(screen.getByText(/Elegir otros\s+documentos es opcional/)).toBeTruthy()
    expect(screen.getByText(/todo documento que selecciones aquí será\s+obligatorio para postularse/)).toBeTruthy()
  })

  it('no rotula como «Opcionales» lo que en realidad queda obligatorio', () => {
    render(<EtapaDocumentos ctx={ctx} />)

    expect(screen.queryByText('Opcionales')).toBeNull()
    expect(screen.getByText(/Otros documentos \(los que elijas serán obligatorios\)/)).toBeTruthy()
    expect(screen.getByText('Básicos (siempre incluidos)')).toBeTruthy()
  })
})

describe('botón que guarda un documento nuevo', () => {
  const abierto = { ...ctx, mostrarNuevoDocumento: true, nuevoDocumento: 'Especialización' }

  it('en reposo se llama «Agregar» y está disponible', () => {
    render(<EtapaDocumentos ctx={abierto} />)
    const boton = screen.getByRole('button', { name: 'Agregar' })
    expect(boton.disabled).toBe(false)
    expect(boton.getAttribute('aria-busy')).toBeNull()
  })

  it('guardando: queda bloqueado, ocupado y con la rueda del sistema junto a «Guardando…»', () => {
    const { container } = render(<EtapaDocumentos ctx={{ ...abierto, guardandoDocumento: true }} />)
    const boton = screen.getByRole('button', { name: 'Guardando…' })
    expect(boton.disabled).toBe(true)
    expect(boton.getAttribute('aria-busy')).toBe('true')
    expect(boton.querySelector('[class*=animate-spin]')).toBeTruthy()
    expect(container.querySelectorAll('[class*=animate-spin]')).toHaveLength(1)
  })
})

describe('etiquetas de documento', () => {
  it('la tarjeta profesional ya no lleva «Si el cargo la exige»: se muestra la obligatoriedad real', () => {
    expect(ETIQUETAS_DOCUMENTO.tarjeta_profesional).toBeUndefined()
    expect(etiquetasDocumento('tarjeta_profesional', false)).toEqual([])
    expect(etiquetasDocumento('tarjeta_profesional', true)).toEqual(['Obligatorio'])
  })

  it('la libreta militar conserva su regla propia de aplicación', () => {
    expect(etiquetasDocumento('libreta_militar', true)).toEqual(['Obligatorio', 'Solo para hombres'])
  })
})
