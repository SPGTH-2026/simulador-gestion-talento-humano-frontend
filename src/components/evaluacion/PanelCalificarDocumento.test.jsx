import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'

vi.mock('../ui/VisorEnLinea', () => ({ default: ({ ruta }) => <div data-testid="visor">{ruta}</div> }))

import PanelCalificarDocumento from './PanelCalificarDocumento'
import { EtiquetaEvaluacion } from './PresentacionEvaluacion'

afterEach(cleanup)

const hoja = { id: 'doc-1', nombre: 'Hoja de vida', estado: 'subido', archivo: { id: 7 }, items: ['Datos completos', 'Firmada', 'Con fecha'] }
const identidad = { id: 'doc-2', nombre: 'Documento de identidad', estado: 'subido', archivo: { id: 8 }, items: [] }

const montar = (documento, extra = {}) => {
  const props = {
    documento,
    ruta: '/revision/postulaciones/9/documentos/7/archivo?inline=1',
    puntos: 45,
    respuestas: {},
    itemMarcas: {},
    ampliado: false,
    onAmpliar: vi.fn(),
    onCerrar: vi.fn(),
    onMarcaItem: vi.fn(),
    onMarcaDocumento: vi.fn(),
    ...extra,
  }
  render(<PanelCalificarDocumento {...props} />)
  return props
}

describe('PanelCalificarDocumento', () => {
  it('muestra el documento al lado y su checklist con un ítem por línea', () => {
    montar(hoja)

    expect(screen.getByTestId('visor').textContent).toBe('/revision/postulaciones/9/documentos/7/archivo?inline=1')
    expect(screen.getByText('Datos completos')).toBeTruthy()
    expect(screen.getByText('Firmada')).toBeTruthy()
    expect(screen.getByText(/Vale 45\.00\s%/)).toBeTruthy()
  })

  it('con checklist no hay botones del documento: muestra un indicador según la mayoría de los ítems', () => {
    montar(hoja, { itemMarcas: { 'docitem-1-0': true, 'docitem-1-1': true, 'docitem-1-2': false } })

    expect(screen.queryByRole('group', { name: /Hoja de vida/ })).toBeNull()
    expect(screen.getByText('Cumple · 2 de 3')).toBeTruthy()
  })

  it('la mitad exacta no alcanza: «No cumple» y dice cuántos necesita', () => {
    const cuatro = { ...hoja, items: ['A', 'B', 'C', 'D'] }
    montar(cuatro, { itemMarcas: { 'docitem-1-0': true, 'docitem-1-1': true, 'docitem-1-2': false, 'docitem-1-3': false } })

    expect(screen.getByText('No cumple · 2 de 4')).toBeTruthy()
    expect(screen.getByText(/más de la mitad de los ítems \(3 de 4\)/)).toBeTruthy()
  })

  it('mientras faltan ítems por calificar queda «En curso»', () => {
    montar(hoja, { itemMarcas: { 'docitem-1-0': true } })

    expect(screen.getByText('En curso · 1 de 3')).toBeTruthy()
  })

  it('marcar un ítem avisa con su clave', () => {
    const props = montar(hoja)
    const item = screen.getByRole('group', { name: /Firmada/ })

    fireEvent.click(within(item).getByLabelText('No cumple'))
    expect(props.onMarcaItem).toHaveBeenCalledWith('docitem-1-1', false)
  })

  it('un documento sin checklist solo muestra su Cumple / No cumple', () => {
    const props = montar(identidad)

    expect(screen.queryByText('Checklist')).toBeNull()
    fireEvent.click(within(screen.getByRole('group', { name: /Documento de identidad/ })).getByLabelText('No cumple'))
    expect(props.onMarcaDocumento).toHaveBeenCalledWith(false)
  })

  it('«Ampliar documento» alterna con «Reducir documento»', () => {
    const props = montar(hoja)
    fireEvent.click(screen.getByRole('button', { name: 'Ampliar documento' }))
    expect(props.onAmpliar).toHaveBeenCalled()

    cleanup()
    montar(hoja, { ampliado: true })
    expect(screen.getByRole('button', { name: 'Reducir documento' })).toBeTruthy()
  })

  it('un documento sin cargar no abre el visor y no deja marcar «Cumple»', () => {
    montar({ ...identidad, estado: 'pendiente', archivo: null }, { faltante: true })

    expect(screen.queryByTestId('visor')).toBeNull()
    expect(screen.getByText(/todavía no cargó este documento/)).toBeTruthy()
    expect(within(screen.getByRole('group', { name: /Documento de identidad/ })).getByLabelText('Cumple').disabled).toBe(true)
  })

  it('en solo lectura no se puede marcar nada', () => {
    montar(hoja, { soloLectura: true })

    for (const radio of screen.getAllByRole('radio')) expect(radio.disabled).toBe(true)
  })
})

describe('EtiquetaEvaluacion: plazo de corrección', () => {
  it('avisa «Plazo vencido» cuando el aspirante no respondió a tiempo', () => {
    render(<EtiquetaEvaluacion evaluacion={{ estado: 'correccion_solicitada', correccion_estado: 'vencida', documentos_actualizados: [] }} />)
    expect(screen.getByText('Plazo vencido')).toBeTruthy()
  })

  it('con el plazo vigente sigue diciendo «En corrección»', () => {
    render(<EtiquetaEvaluacion evaluacion={{ estado: 'correccion_solicitada', correccion_estado: 'vigente', documentos_actualizados: [] }} />)
    expect(screen.getByText('En corrección')).toBeTruthy()
  })
})
