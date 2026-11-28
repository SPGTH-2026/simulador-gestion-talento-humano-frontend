import { describe, expect, it } from 'vitest'
import {
  armarTelefono,
  limpiarCampo,
  limpiarDireccion,
  limpiarDocumento,
  partirTelefono,
  soloLetras,
  telefonoValido,
} from './camposPersonales'

describe('teléfono con código del país', () => {
  it('parte y arma el valor «+57 3001234567»', () => {
    expect(partirTelefono('+57 3001234567')).toEqual({ codigo: '57', numero: '3001234567' })
    expect(armarTelefono('57', '3001234567')).toBe('+57 3001234567')
    expect(armarTelefono('57', '')).toBe('')
  })

  it('un teléfono guardado sin código se toma como colombiano', () => {
    expect(partirTelefono('3001234567')).toEqual({ codigo: '57', numero: '3001234567' })
    expect(partirTelefono('')).toEqual({ codigo: '57', numero: '' })
  })

  it('quita letras y símbolos y corta al largo del país', () => {
    expect(limpiarCampo('telefono', '+57 30a0-12 34567890')).toBe('+57 3001234567')
    expect(limpiarCampo('telefono', '+593 99 123 4567 89')).toBe('+593 991234567')
    expect(limpiarCampo('telefono', '+58 412-123-4567-999')).toBe('+58 4121234567')
  })

  it('Colombia pide exactamente 10 dígitos; otros países, su propio largo', () => {
    expect(telefonoValido('+57 3001234567')).toBe(true)
    expect(telefonoValido('+57 300123456')).toBe(false)
    expect(telefonoValido('+593 991234567')).toBe(true)
    expect(telefonoValido('+593 99123')).toBe(false)
    expect(telefonoValido('')).toBe(false)
  })
})

describe('nombres, dirección y documento', () => {
  it('los nombres solo llevan letras, tildes, ñ, espacio, apóstrofo, punto y guion', () => {
    expect(soloLetras('Camilo 123 Andrés@', 100)).toBe('Camilo  Andrés')
    expect(soloLetras("O'Neill-Peña", 100)).toBe("O'Neill-Peña")
    expect(soloLetras('  --Ana', 100)).toBe('Ana')
  })

  it('respeta el largo máximo de cada campo', () => {
    expect(limpiarCampo('nombres', 'a'.repeat(150))).toHaveLength(100)
    expect(limpiarCampo('representante_parentesco', 'a'.repeat(60))).toHaveLength(40)
    expect(limpiarCampo('direccion', 'a'.repeat(200))).toHaveLength(150)
  })

  it('la dirección admite # - . , ° / pero no símbolos de código', () => {
    expect(limpiarDireccion('Calle 10 # 20-30, Apto 4° <b>')).toBe('Calle 10 # 20-30, Apto 4° b')
  })

  it('la cédula es solo números y el pasaporte admite letras en mayúscula', () => {
    expect(limpiarDocumento('cc', '1.012.345-678abc')).toBe('1012345678')
    expect(limpiarDocumento('cc', '1'.repeat(30))).toHaveLength(15)
    expect(limpiarDocumento('pasaporte', 'ab-123 456')).toBe('AB123456')
  })

  it('al cambiar el tipo de documento el número se vuelve a limpiar', () => {
    expect(limpiarCampo('numero_documento', 'AB123456', { tipo_documento_identidad: 'cc' })).toBe('123456')
    expect(limpiarCampo('numero_documento', 'AB123456', { tipo_documento_identidad: 'pasaporte' })).toBe('AB123456')
  })

  it('el correo no lleva espacios y va en minúsculas', () => {
    expect(limpiarCampo('representante_correo', ' Marta.Perez @Example.com ')).toBe('marta.perez@example.com')
  })
})
