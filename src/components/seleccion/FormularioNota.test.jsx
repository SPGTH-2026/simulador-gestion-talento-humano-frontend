import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FormularioNota } from './PiezasCalificaciones'
import { permiteEscribirNota, validarNota } from '../../lib/seleccion'

afterEach(cleanup)

// «Escribir» = una secuencia de cambios, uno por tecla; «pegar» = un solo cambio con el texto completo. En ambos casos el
// navegador entrega el texto resultante al onChange, que es lo que se simula.
const campo = () => screen.getByLabelText(/Nota \(0 a 10\)/)
const poner = (texto) => fireEvent.change(campo(), { target: { value: texto } })
const escribir = (texto) => {
  let acumulado = ''
  for (const tecla of texto) {
    // Una tecla rechazada deja el campo como estaba: el siguiente carácter se suma al texto que quedó.
    acumulado = campo().value + tecla
    poner(acumulado)
  }
}
const montar = (onGuardar = vi.fn()) => render(<FormularioNota actividad={{ id: 'entrevista' }} onGuardar={onGuardar} onCancelar={() => {}} />)

describe('permiteEscribirNota (qué puede llegar a ser una nota válida)', () => {
  it.each(['', '8', '8,', '8.', '8,5', '7.25', '10', '10,0', '10.00', '0', '0,5'])('permite «%s»', (texto) => {
    expect(permiteEscribirNota(texto).permitido).toBe(true)
  })

  it.each([
    ['10,01', 'La nota debe estar entre 0 y 10.'],
    ['11', 'La nota debe estar entre 0 y 10.'],
    ['100', 'La nota debe estar entre 0 y 10.'],
    ['8,555', 'Usa como máximo dos decimales.'],
    ['8,5.5', 'Usa un solo separador decimal (coma o punto).'],
    ['8,,5', 'Usa un solo separador decimal (coma o punto).'],
    ['abc', 'La nota solo puede llevar números y un separador decimal (coma o punto).'],
    ['8a', 'La nota solo puede llevar números y un separador decimal (coma o punto).'],
    ['8 5', 'La nota solo puede llevar números y un separador decimal (coma o punto).'],
    [',5', 'Escribe la parte entera antes del separador, por ejemplo 0,5.'],
  ])('rechaza «%s»', (texto, mensaje) => {
    expect(permiteEscribirNota(texto)).toEqual({ permitido: false, mensaje })
  })

  it('el rango se sigue validando al guardar: lo permitido pero incompleto no es una nota todavía', () => {
    expect(validarNota('8,').ok).toBe(false)
    expect(validarNota('').ok).toBe(false)
    expect(validarNota('8,5')).toEqual({ ok: true, valor: '8.5' })
    expect(validarNota('10')).toEqual({ ok: true, valor: '10' })
  })
})

describe('FormularioNota: escribir y pegar', () => {
  it.each([
    ['8,5', '8,5'],
    ['7.25', '7.25'],
    ['10', '10'],
  ])('al escribir «%s» queda «%s» y se puede guardar', (texto, esperado) => {
    montar()
    escribir(texto)
    expect(campo().value).toBe(esperado)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('al escribir 10,01 la última tecla se rechaza, queda 10,0 y se explica el motivo', () => {
    montar()
    escribir('10,01')
    expect(campo().value).toBe('10,0')
    expect(screen.getByText('La nota debe estar entre 0 y 10.')).toBeTruthy()
  })

  it('las letras no entran al campo', () => {
    montar()
    escribir('8x')
    expect(campo().value).toBe('8')
    expect(screen.getByText(/solo puede llevar números/)).toBeTruthy()
  })

  it('un segundo separador no entra', () => {
    montar()
    escribir('8,5.')
    expect(campo().value).toBe('8,5')
    expect(screen.getByText(/un solo separador decimal/)).toBeTruthy()
  })

  it.each([
    ['8,5abc', ''],
    ['10,01', ''],
    ['8,5,5', ''],
    ['7.255', ''],
  ])('pegar «%s» inválido se rechaza entero, sin limpiarlo a otro valor', (texto, esperado) => {
    montar()
    poner(texto)
    expect(campo().value).toBe(esperado)
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it.each([
    ['8,5', '8,5'],
    ['7.25', '7.25'],
    ['10', '10'],
  ])('pegar «%s» válido lo deja tal cual', (texto, esperado) => {
    montar()
    poner(texto)
    expect(campo().value).toBe(esperado)
  })

  it('permite borrar y escribir valores intermedios', () => {
    montar()
    escribir('8,5')
    poner('8,')
    expect(campo().value).toBe('8,')
    poner('8')
    poner('')
    expect(campo().value).toBe('')
    escribir('9')
    expect(campo().value).toBe('9')
  })

  it('al guardar valida el rango y no envía una nota incompleta', () => {
    const onGuardar = vi.fn()
    montar(onGuardar)
    escribir('8,')
    fireEvent.submit(campo().closest('form'))
    expect(onGuardar).not.toHaveBeenCalled()
    expect(screen.getByText('Completa los decimales o quita el separador.')).toBeTruthy()
  })
})
