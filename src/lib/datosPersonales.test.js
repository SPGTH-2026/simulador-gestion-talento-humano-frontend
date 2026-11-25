import { describe, expect, it } from 'vitest'
import { categoriaDeEdad, cuerpoDesdeForm, edadDe, formCompleto, formDesdeDatos, FORM_VACIO } from './datosPersonales'

const HOY = new Date(2026, 10, 25) // 25 de noviembre de 2026

describe('edadDe', () => {
  it('cuenta los años cumplidos', () => {
    expect(edadDe('2010-11-25', HOY)).toBe(16)
    expect(edadDe('2010-11-26', HOY)).toBe(15)
    expect(edadDe('2000-01-01', HOY)).toBe(26)
  })

  it('devuelve null con fechas inválidas o futuras', () => {
    expect(edadDe('', HOY)).toBeNull()
    expect(edadDe('2010-02-31', HOY)).toBeNull()
    expect(edadDe('2030-01-01', HOY)).toBeNull()
  })
})

describe('categoriaDeEdad', () => {
  it('clasifica por edad', () => {
    expect(categoriaDeEdad('', HOY)).toBe('sin_fecha')
    expect(categoriaDeEdad('2010-11-26', HOY)).toBe('bajo_minimo') // 15
    expect(categoriaDeEdad('2010-11-25', HOY)).toBe('menor') // 16
    expect(categoriaDeEdad('2008-11-26', HOY)).toBe('menor') // 17
    expect(categoriaDeEdad('2008-11-25', HOY)).toBe('mayor') // 18
  })
})

describe('cuerpoDesdeForm', () => {
  const form = { ...FORM_VACIO, representante_nombre: 'Marta', fecha_nacimiento: '2000-01-01' }

  it('quita los datos del representante a un mayor de edad', () => {
    expect(cuerpoDesdeForm(form, HOY)).not.toHaveProperty('representante_nombre')
  })

  it('los conserva en un menor', () => {
    expect(cuerpoDesdeForm({ ...form, fecha_nacimiento: '2009-06-01' }, HOY)).toHaveProperty('representante_nombre', 'Marta')
  })
})

describe('formCompleto', () => {
  const lleno = {
    ...FORM_VACIO,
    sexo: 'mujer', tipo_documento_identidad: 'cc', numero_documento: '1012345678', nombres: 'Ana', apellidos: 'Pérez',
    fecha_nacimiento: '2000-01-01', telefono: '3001234567', departamento: '05', municipio: '05001', nivel_formacion: 'tecnologo',
  }

  it('un mayor de edad solo necesita los campos obligatorios', () => {
    expect(formCompleto(lleno, HOY)).toBe(true)
    expect(formCompleto({ ...lleno, municipio: '' }, HOY)).toBe(false)
  })

  it('un menor también necesita al representante', () => {
    const menor = { ...lleno, fecha_nacimiento: '2009-06-01' }
    expect(formCompleto(menor, HOY)).toBe(false)
    expect(
      formCompleto({ ...menor, representante_nombre: 'Marta', representante_documento: '52123456', representante_telefono: '3109876543', representante_parentesco: 'Madre' }, HOY),
    ).toBe(true)
  })
})

describe('formDesdeDatos', () => {
  it('sin datos devuelve el formulario vacío', () => {
    expect(formDesdeDatos(null)).toEqual(FORM_VACIO)
  })

  it('usa los códigos de los catálogos', () => {
    const form = formDesdeDatos({
      nombres: 'Ana',
      direccion: null,
      tipo_documento_identidad: { codigo: 'cc', nombre: 'Cédula' },
      nivel_formacion: { codigo: 'tecnologo', nombre: 'Tecnólogo' },
      departamento: { codigo: '05', nombre: 'Antioquia' },
      municipio: { codigo: '05001', nombre: 'Medellín' },
    })
    expect(form).toMatchObject({ nombres: 'Ana', direccion: '', tipo_documento_identidad: 'cc', nivel_formacion: 'tecnologo', departamento: '05', municipio: '05001' })
  })
})
