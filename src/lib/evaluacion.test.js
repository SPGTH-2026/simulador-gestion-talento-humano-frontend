import { describe, expect, it } from 'vitest'
import {
  atajoDocumento,
  calcularPuntaje,
  contarPendientes,
  fechaEvaluacionPasada,
  formatearPorcentaje,
  hayNoCumple,
  indicadorDocumento,
  resultadoDocumento,
} from './evaluacion'

describe('fechaEvaluacionPasada', () => {
  it('sin fecha no hay aviso', () => {
    expect(fechaEvaluacionPasada(null, '2026-11-27')).toBe(false)
    expect(fechaEvaluacionPasada('', '2026-11-27')).toBe(false)
  })

  it('una fecha anterior a hoy ya pasó', () => {
    expect(fechaEvaluacionPasada('2026-11-26', '2026-11-27')).toBe(true)
  })

  it('el mismo día todavía no cuenta como pasada, ni una fecha futura', () => {
    expect(fechaEvaluacionPasada('2026-11-27', '2026-11-27')).toBe(false)
    expect(fechaEvaluacionPasada('2026-12-01', '2026-11-27')).toBe(false)
  })

  it('acepta una fecha con hora sin desplazar el día', () => {
    expect(fechaEvaluacionPasada('2026-11-26T00:00:00.000000Z', '2026-11-27')).toBe(true)
  })
})

const hoja = { id: 'doc-1', estado: 'subido', items: ['A', 'B', 'C', 'D'] }
const identidad = { id: 'doc-2', estado: 'subido', items: [] }
const puntos = { documentos: { 1: 45, 2: 45 }, habilidades: { 10: 5, 11: 5 } }
const hoja3 = { id: 'doc-3', estado: 'subido', items: ['A', 'B', 'C'] }
const marcas = (valores) => Object.fromEntries(valores.map((v, n) => [`docitem-1-${n}`, v]))

const conItems = (n) => ({ id: 'doc-1', items: Array.from({ length: n }, (_, i) => `Ítem ${i}`) })
// Marcas de los primeros ítems: [true, false, undefined...]; `sinMarcar` completa con ítems sin calificar hasta n.
const marcasDe = (valores) => Object.fromEntries(valores.map((v, n) => [`docitem-1-${n}`, v]).filter(([, v]) => v !== undefined))

describe('indicadorDocumento: hay que superar la mitad de los ítems', () => {
  it.each([
    // [ítems, ✓, ✗, estado esperado]
    [5, 3, 2, 'cumple'], // 3 de 5
    [5, 2, 3, 'no_cumple'], // 2 de 5
    [6, 4, 2, 'cumple'], // 4 de 6
    [6, 3, 3, 'no_cumple'], // 3 de 6: la mitad exacta no alcanza
    [4, 2, 2, 'no_cumple'], // 2 de 4
    [3, 2, 1, 'cumple'], // 2 de 3
  ])('con %i ítems, %i ✓ y %i ✗ es «%s»', (total, buenos, malos, estado) => {
    const valores = [...Array(buenos).fill(true), ...Array(malos).fill(false)]
    expect(indicadorDocumento(conItems(total), marcasDe(valores)).estado).toBe(estado)
  })

  it('a medias queda «en curso» mientras todavía pueda ir a cualquier lado', () => {
    expect(indicadorDocumento(conItems(6), marcasDe([true, true])).estado).toBe('en_curso')
    expect(indicadorDocumento(conItems(6), {}).estado).toBe('en_curso')
  })

  it('anticipa «cumple» o «no cumple» apenas ya no puede cambiar', () => {
    expect(indicadorDocumento(conItems(5), marcasDe([true, true, true])).estado).toBe('cumple')
    expect(indicadorDocumento(conItems(5), marcasDe([false, false, false])).estado).toBe('no_cumple')
    // 2 de 4 ✗ ya no deja superar la mitad.
    expect(indicadorDocumento(conItems(4), marcasDe([false, false])).estado).toBe('no_cumple')
  })

  it('dice cuántos ítems necesita para cumplir', () => {
    expect(indicadorDocumento(conItems(6), {}).necesita).toBe(4)
    expect(indicadorDocumento(conItems(5), {}).necesita).toBe(3)
  })

  it('un documento sin checklist no tiene indicador', () => {
    expect(indicadorDocumento({ id: 'doc-2', items: [] }, {})).toBeNull()
  })
})

describe('resultadoDocumento y botones de un documento', () => {
  it('con checklist el resultado sale de la mayoría de los ítems', () => {
    expect(resultadoDocumento(conItems(5), {}, marcasDe([true, true, true, false, false]))).toBe(true)
    expect(resultadoDocumento(conItems(5), {}, marcasDe([true, true, false, false, false]))).toBe(false)
    expect(resultadoDocumento(conItems(6), {}, marcasDe([true, true]))).toBeUndefined()
  })

  it('sin checklist usa su propio Cumple / No cumple y muestra los botones', () => {
    const identidad = { id: 'doc-2', items: [] }
    expect(resultadoDocumento(identidad, { 'doc-2': false }, {})).toBe(false)
    expect(atajoDocumento(identidad, { 'doc-2': true })).toEqual({ visible: true, valor: true })
  })

  it('con checklist no hay botones del documento', () => {
    expect(atajoDocumento(conItems(4), {}).visible).toBe(false)
  })
})

describe('formatearPorcentaje', () => {
  it('siempre muestra dos decimales', () => {
    expect(formatearPorcentaje(5)).toBe('5.00 %')
    expect(formatearPorcentaje(2.5)).toBe('2.50 %')
    expect(formatearPorcentaje(66.666)).toBe('66.67 %')
    expect(formatearPorcentaje(0)).toBe('0.00 %')
  })
})

describe('calcularPuntaje', () => {
  const habilidades = [{ id: 10 }, { id: 11 }]

  it('4 de 4 ítems y el otro documento cumplido dan los 90 puntos de documentos', () => {
    const r = calcularPuntaje({
      aplicables: [hoja, identidad],
      respuestas: { 'doc-2': true },
      itemMarcas: marcas([true, true, true, true]),
      puntos,
    })
    expect(r.total).toBe(90)
    expect(r.maxDocumentos).toBe(90)
  })

  it('un documento con 3 de 4 ítems aporta 3/4 de sus puntos', () => {
    const r = calcularPuntaje({ aplicables: [hoja], itemMarcas: marcas([true, true, true, false]), puntos: { documentos: { 1: 80 } } })
    expect(r.total).toBe(60)
  })

  it('no redondea al entero: un tercio de un documento da dos decimales', () => {
    const r = calcularPuntaje({ aplicables: [hoja3, identidad], respuestas: { 'doc-2': true }, itemMarcas: { 'docitem-3-0': true, 'docitem-3-1': false, 'docitem-3-2': false }, puntos: { documentos: { 3: 50, 2: 50 } } })
    expect(r.total).toBe(66.67)
  })

  it('las habilidades declaradas y marcadas «Cumple» suman sus puntos; las no marcadas, no', () => {
    const r = calcularPuntaje({
      aplicables: [identidad],
      respuestas: { 'doc-2': true },
      habilidades,
      skillMarcas: { 'skill-10': true, 'skill-11': false },
      puntos,
    })
    expect(r.total).toBe(50)
    expect(r.habilidades).toBe(5)
  })

  it('sin puntos del servidor reparte el 100 entre los documentos', () => {
    const r = calcularPuntaje({ aplicables: [identidad, { id: 'doc-3', estado: 'subido', items: [] }], respuestas: { 'doc-2': true } })
    expect(r.total).toBe(50)
  })
})

describe('pendientes y «No cumple»', () => {
  const comun = { aplicables: [hoja, identidad], habilidades: [{ id: 10 }] }

  it('cuenta ítems, documentos sin checklist y habilidades declaradas sin calificar', () => {
    expect(contarPendientes({ ...comun, itemMarcas: marcas([true, true]) })).toBe(2 + 1 + 1)
    expect(
      contarPendientes({ ...comun, respuestas: { 'doc-2': true }, itemMarcas: marcas([true, true, true, true]), skillMarcas: { 'skill-10': false } }),
    ).toBe(0)
  })

  it('un documento sin cargar no cuenta como pendiente', () => {
    expect(contarPendientes({ aplicables: [{ id: 'doc-9', estado: 'pendiente', items: [] }] })).toBe(0)
  })

  it('detecta un «No cumple» en un ítem, un documento o una habilidad', () => {
    expect(hayNoCumple({ aplicables: [hoja], itemMarcas: marcas([true, false, true, true]) })).toBe(true)
    expect(hayNoCumple({ aplicables: [identidad], respuestas: { 'doc-2': false } })).toBe(true)
    expect(hayNoCumple({ aplicables: [], habilidades: [{ id: 10 }], skillMarcas: { 'skill-10': false } })).toBe(true)
    expect(hayNoCumple({ aplicables: [identidad], respuestas: { 'doc-2': true } })).toBe(false)
  })
})
