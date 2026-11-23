import { describe, it, expect } from 'vitest'
import { MENSAJES_CERRADOS, nombreRonda, textoPlazo } from './correcciones'
import { formatearFechaHoraExacta } from './ventanaPostulacion'

describe('formatearFechaHoraExacta', () => {
  it('muestra la fecha y la hora en America/Bogota aunque la fecha llegue en UTC', () => {
    // 01:09 UTC del 23/11 son las 20:09 del 22/11 en Colombia (UTC-5).
    expect(formatearFechaHoraExacta('2026-11-23T01:09:44+00:00')).toBe('22/11/2026 20:09')
  })

  it('no inventa una fecha cuando falta o es inválida', () => {
    expect(formatearFechaHoraExacta(null)).toBe('—')
    expect(formatearFechaHoraExacta('no es una fecha')).toBe('—')
  })
})

describe('rondas de corrección', () => {
  it('rotula la ronda ordinaria con su número y la excepcional aparte', () => {
    expect(nombreRonda({ tipo: 'ordinaria', numero: 2 })).toBe('Ronda 2')
    expect(nombreRonda({ tipo: 'excepcional', numero: 1 })).toBe('Ronda excepcional')
  })

  it('describe el plazo según el estado, con fecha y hora exactas', () => {
    const fin = '2026-11-25T01:08:44+00:00'
    expect(textoPlazo({ estado: 'vigente', fecha_limite: fin })).toBe('Vence el 24/11/2026 20:08')
    expect(textoPlazo({ estado: 'vencida', fecha_limite: fin })).toBe('Venció el 24/11/2026 20:08')
    expect(textoPlazo({ estado: 'respondida', respondida_at: fin })).toBe('Respondida el 24/11/2026 20:08')
    expect(textoPlazo({ estado: 'sin_plazo' })).toBe('Sin plazo registrado')
  })

  it('explica al aspirante por qué ya no puede responder', () => {
    expect(MENSAJES_CERRADOS.sin_plazo()).toContain('no tiene plazo registrado')
    expect(MENSAJES_CERRADOS.vencida({ fecha_limite: '2026-11-25T01:08:44+00:00' })).toContain('hora de Colombia')
  })
})
