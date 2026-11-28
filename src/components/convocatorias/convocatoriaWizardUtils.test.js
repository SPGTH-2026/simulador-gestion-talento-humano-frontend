import { describe, it, expect } from 'vitest'
import { DOCUMENTOS_OBLIGATORIOS } from '../../lib/documentosConvocatoria'
import { formInicial, repartoIgual, claveSkill, soloDigitos, formatearMiles } from './convocatoriaWizardUtils'

describe('formInicial', () => {
  it('en una convocatoria nueva siembra los documentos obligatorios (sin error de referencia)', () => {
    const inicial = formInicial(null)
    expect(inicial.documentos).toEqual([...DOCUMENTOS_OBLIGATORIOS])
    expect(inicial.vacantes).toBe('1')
    expect(inicial.nombre).toBe('')
  })

  it('en edición toma los documentos reales de la convocatoria', () => {
    const inicial = formInicial({
      nombre: 'Auxiliar',
      documentos: [{ codigo: 'hoja_de_vida', ponderacion: 60 }],
    })
    expect(inicial.documentos).toEqual(['hoja_de_vida'])
    expect(inicial.nombre).toBe('Auxiliar')
  })
})

describe('repartoIgual', () => {
  it('reparte el 100 % en partes exactamente iguales: ninguno vale más que otro', () => {
    const mapa = repartoIgual(['a', 'b', 'c'])
    expect(Object.keys(mapa)).toEqual(['a', 'b', 'c'])
    expect(new Set(Object.values(mapa)).size).toBe(1)
    expect(mapa.a).toBe('33.3333')
    const suma = Object.values(mapa).reduce((acc, v) => acc + Number(v), 0)
    expect(Math.abs(suma - 100)).toBeLessThan(0.01)
  })

  it('cuando divide exacto, no deja decimales', () => {
    expect(repartoIgual(['a', 'b', 'c', 'd'])).toEqual({ a: '25', b: '25', c: '25', d: '25' })
  })

  it('sin documentos no reparte nada', () => {
    expect(repartoIgual([])).toEqual({})
  })
})

describe('claveSkill', () => {
  it('compara sin mayúsculas ni espacios sobrantes', () => {
    expect(claveSkill('  Excel   Avanzado ')).toBe(claveSkill('excel avanzado'))
  })
})

describe('dígitos de salarios', () => {
  it('quita lo que no sea dígito y agrupa en miles', () => {
    expect(soloDigitos('1.234.567')).toBe('1234567')
    expect(formatearMiles('1234567')).toMatch(/1.234.567/)
  })
})
