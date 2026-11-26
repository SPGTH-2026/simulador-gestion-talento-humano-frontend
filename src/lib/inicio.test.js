import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { postulacionActivaEnInicio } from './inicio'

// «Hoy» fijo en Bogotá para que la ventana de postulación sea predecible.
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-26T15:00:00-05:00'))
})
afterEach(() => vi.useRealTimers())

const convocatoria = (estado, apertura = '2026-11-01', cierre = '2026-12-15') => ({
  estado: { codigo: estado },
  fecha_apertura: apertura,
  fecha_cierre: cierre,
})
const postulacion = (estado, conv) => ({ estado: { codigo: estado }, convocatoria: conv })

describe('postulacionActivaEnInicio', () => {
  it('un borrador con la convocatoria abierta se muestra', () => {
    expect(postulacionActivaEnInicio(postulacion('borrador', convocatoria('publicada')))).toBe(true)
  })

  it('un borrador cuya convocatoria ya cerró NO se muestra', () => {
    expect(postulacionActivaEnInicio(postulacion('borrador', convocatoria('publicada', '2026-10-01', '2026-10-23')))).toBe(false)
  })

  it('un borrador de una convocatoria que aún no abre no se muestra', () => {
    expect(postulacionActivaEnInicio(postulacion('borrador', convocatoria('publicada', '2026-12-01', '2026-12-30')))).toBe(false)
  })

  it('un borrador de una convocatoria que ya no está publicada no se muestra', () => {
    for (const estado of ['en_proceso', 'cerrada', 'borrador']) {
      expect(postulacionActivaEnInicio(postulacion('borrador', convocatoria(estado)))).toBe(false)
    }
  })

  it('una postulación enviada se muestra mientras la convocatoria siga publicada o en proceso, aunque ya haya pasado su cierre', () => {
    expect(postulacionActivaEnInicio(postulacion('postulada', convocatoria('publicada')))).toBe(true)
    expect(postulacionActivaEnInicio(postulacion('postulada', convocatoria('publicada', '2026-10-01', '2026-10-23')))).toBe(true)
    expect(postulacionActivaEnInicio(postulacion('postulada', convocatoria('en_proceso')))).toBe(true)
  })

  it('una postulación enviada deja de mostrarse cuando el proceso terminó (convocatoria cerrada)', () => {
    expect(postulacionActivaEnInicio(postulacion('postulada', convocatoria('cerrada')))).toBe(false)
  })

  it('una retirada nunca se muestra', () => {
    expect(postulacionActivaEnInicio(postulacion('retirada', convocatoria('publicada')))).toBe(false)
  })

  it('sin datos de la postulación no se muestra', () => {
    expect(postulacionActivaEnInicio(undefined)).toBe(false)
    expect(postulacionActivaEnInicio({})).toBe(false)
  })
})
