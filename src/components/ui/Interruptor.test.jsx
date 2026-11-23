import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Interruptor from './Interruptor'

afterEach(cleanup)

const interruptor = () => screen.getByRole('switch', { name: 'Excel' })

// Tres estados por separado: la declaración actual (activo), el guardado en curso (ocupado) y la edición bloqueada (bloqueado).
describe('Interruptor', () => {
  it('refleja el estado real (aria-checked), se nombra por la habilidad y cambia con clic', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Interruptor nombre="Excel" activo={false} onChange={onChange} />)

    expect(interruptor().getAttribute('aria-checked')).toBe('false')
    fireEvent.click(interruptor())
    expect(onChange).toHaveBeenCalledWith(true)

    // No guarda estado propio: si la operación se cancela o falla, sigue como lo deja quien lo usa.
    expect(interruptor().getAttribute('aria-checked')).toBe('false')
    rerender(<Interruptor nombre="Excel" activo onChange={onChange} />)
    expect(interruptor().getAttribute('aria-checked')).toBe('true')
    fireEvent.click(interruptor())
    expect(onChange).toHaveBeenLastCalledWith(false)
  })

  it('usa el elemento visible que lo nombra como etiqueta accesible', () => {
    render(
      <>
        <span id="nombre-skill">Comunicación asertiva</span>
        <Interruptor idNombre="nombre-skill" activo={false} onChange={() => {}} />
      </>,
    )
    expect(screen.getByRole('switch', { name: 'Comunicación asertiva' })).toBeTruthy()
  })

  it('con teclado: es enfocable y el Espacio/Enter lo activan como un botón', () => {
    const onChange = vi.fn()
    render(<Interruptor nombre="Excel" activo={false} onChange={onChange} />)

    interruptor().focus()
    expect(document.activeElement).toBe(interruptor())
    expect(interruptor().tagName).toBe('BUTTON')
    expect(interruptor().getAttribute('type')).toBe('button')
  })

  it('guardando: ignora cambios, queda ocupado y conserva el foco (no se deshabilita)', () => {
    const onChange = vi.fn()
    render(<Interruptor nombre="Excel" activo={false} onChange={onChange} ocupado />)

    expect(interruptor().getAttribute('aria-busy')).toBe('true')
    expect(interruptor().disabled).toBe(false)
    interruptor().focus()
    expect(document.activeElement).toBe(interruptor())
    fireEvent.click(interruptor())
    expect(onChange).not.toHaveBeenCalled()
    expect(interruptor().className).toContain('cursor-progress')
  })

  it('bloqueado: ignora cambios, sigue enfocable, sin hover ni animación de acción y con el cursor de no permitido', () => {
    const onChange = vi.fn()
    render(<Interruptor nombre="Excel" activo={false} onChange={onChange} bloqueado ayudaId="motivo" />)

    expect(interruptor().getAttribute('aria-disabled')).toBe('true')
    expect(interruptor().getAttribute('aria-describedby')).toBe('motivo')
    expect(interruptor().disabled).toBe(false)
    fireEvent.click(interruptor())
    expect(onChange).not.toHaveBeenCalled()
    expect(interruptor().className).toContain('cursor-not-allowed')
    const pista = interruptor().firstElementChild.className
    expect(pista).not.toContain('group-hover')
    expect(pista).not.toContain('group-active')
  })

  it('habilitado: sí tiene hover y pulsación en la pista (contraste con el estado bloqueado)', () => {
    render(<Interruptor nombre="Excel" activo={false} onChange={() => {}} />)
    const pista = interruptor().firstElementChild.className
    expect(pista).toContain('group-hover')
    expect(pista).toContain('group-active:scale-[0.96]')
  })
})
