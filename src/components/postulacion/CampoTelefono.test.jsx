import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import CampoTelefono from './CampoTelefono'

afterEach(cleanup)

function Envoltura({ inicial = '', alCambiar }) {
  const [valor, setValor] = useState(inicial)
  return (
    <CampoTelefono
      etiqueta="Teléfono"
      requerido
      valor={valor}
      onCambio={(v) => {
        setValor(v)
        alCambiar?.(v)
      }}
    />
  )
}

describe('CampoTelefono', () => {
  it('arranca con Colombia (+57) y no deja escribir letras', () => {
    const alCambiar = vi.fn()
    render(<Envoltura alCambiar={alCambiar} />)

    expect(screen.getByLabelText('País del teléfono').value).toBe('57')
    const entrada = screen.getByRole('textbox', { name: /teléfono/i })
    fireEvent.change(entrada, { target: { value: '30a0b1' } })

    expect(entrada.value).toBe('3001')
    expect(alCambiar).toHaveBeenLastCalledWith('+57 3001')
  })

  it('en Colombia corta a 10 dígitos', () => {
    render(<Envoltura />)
    const entrada = screen.getByRole('textbox', { name: /teléfono/i })

    fireEvent.change(entrada, { target: { value: '30012345678901' } })
    expect(entrada.value).toBe('3001234567')
    expect(entrada.maxLength).toBe(10)
  })

  it('cambiar de país conserva el número y ajusta el largo', () => {
    const alCambiar = vi.fn()
    render(<Envoltura inicial="+57 3001234567" alCambiar={alCambiar} />)

    fireEvent.change(screen.getByLabelText('País del teléfono'), { target: { value: '593' } })

    expect(alCambiar).toHaveBeenLastCalledWith('+593 300123456')
    expect(screen.getByRole('textbox', { name: /teléfono/i }).maxLength).toBe(9)
  })

  it('recuerda el país elegido aunque el número esté vacío', () => {
    render(<Envoltura />)
    fireEvent.change(screen.getByLabelText('País del teléfono'), { target: { value: '58' } })

    expect(screen.getByLabelText('País del teléfono').value).toBe('58')
  })

  it('muestra cuántos dígitos pide el país', () => {
    render(<Envoltura />)
    expect(screen.getByText(/10 dígitos, solo números/)).toBeTruthy()
  })

  it('un teléfono guardado sin código se muestra como colombiano', () => {
    render(<Envoltura inicial="3001234567" />)

    expect(screen.getByLabelText('País del teléfono').value).toBe('57')
    expect(screen.getByRole('textbox', { name: /teléfono/i }).value).toBe('3001234567')
  })
})
