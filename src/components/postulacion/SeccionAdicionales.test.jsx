import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(cleanup)

vi.mock('../../hooks/useConfirmacion', () => ({ useConfirmacion: () => vi.fn() }))
vi.mock('../../api/postulacionesDocumentos', () => ({ subirAdicional: vi.fn(), eliminarDocumento: vi.fn() }))

import SeccionAdicionales from './SeccionAdicionales'

const adicional = {
  id: 1,
  titulo: 'Maestría en gestión',
  nota: 'Culminada en 2024',
  archivo: { id: 5, nombre_original: 'maestria.pdf', tamano_bytes: 2048, subido_en: '2026-11-25T10:00:00Z' },
}

const base = { asegurar: vi.fn(), onRecargar: vi.fn(), onError: vi.fn() }
const vista = (adicionales = []) => ({ postulacion: { id: 7, estado: { codigo: 'borrador' } }, adicionales })

const formulario = () => screen.queryByRole('button', { name: /agregar documento adicional/i })

describe('SeccionAdicionales según el estado de la postulación', () => {
  it('editable (sin postulación, borrador o retirada) sin adicionales: muestra el formulario para agregar', () => {
    render(<SeccionAdicionales {...base} vista={vista()} editable />)

    expect(screen.getByRole('heading', { name: 'Documentos adicionales' })).toBeTruthy()
    expect(formulario()).toBeTruthy()
    expect(screen.getByText(/no son obligatorios/i)).toBeTruthy()
  })

  it('editable con adicionales: lista lo agregado, con «Eliminar», y sigue el formulario', () => {
    render(<SeccionAdicionales {...base} vista={vista([adicional])} editable />)

    expect(screen.getByText('Maestría en gestión')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy()
    expect(formulario()).toBeTruthy()
  })

  it('enviada (no editable) sin adicionales: la sección desaparece', () => {
    const { container } = render(<SeccionAdicionales {...base} vista={vista()} editable={false} />)

    expect(container.textContent).toBe('')
    expect(screen.queryByRole('heading', { name: 'Documentos adicionales' })).toBeNull()
  })

  it('enviada con adicionales: solo la lista, sin formulario ni «Eliminar» ni texto de invitación', () => {
    render(<SeccionAdicionales {...base} vista={vista([adicional])} editable={false} />)

    expect(screen.getByRole('heading', { name: 'Documentos adicionales' })).toBeTruthy()
    expect(screen.getByText('Maestría en gestión')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Ver' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
    expect(formulario()).toBeNull()
    expect(screen.queryByText(/no son obligatorios/i)).toBeNull()
    expect(screen.queryByText(/de 5/)).toBeNull()
  })

  it('con una corrección vigente tampoco se agrega nada: sin adicionales no se dibuja la sección', () => {
    const { container } = render(<SeccionAdicionales {...base} vista={vista()} editable bloqueoCorreccion />)

    expect(container.textContent).toBe('')
  })

  it('con una corrección vigente y adicionales previos: solo la lista', () => {
    render(<SeccionAdicionales {...base} vista={vista([adicional])} editable bloqueoCorreccion />)

    expect(screen.getByText('Maestría en gestión')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
    expect(formulario()).toBeNull()
  })
})
