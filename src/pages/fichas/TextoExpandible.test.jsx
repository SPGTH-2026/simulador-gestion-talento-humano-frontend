import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import TextoExpandible from './TextoExpandible'

const original = { scroll: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight'), client: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight') }

// jsdom no calcula el diseño: se simula que el texto mide más (o no) que su caja y que ResizeObserver avisa al observar.
const simular = (scrollHeight, clientHeight) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => scrollHeight })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => clientHeight })
  vi.stubGlobal('ResizeObserver', class { constructor(cb) { this.cb = cb } observe() { this.cb() } disconnect() {} })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  if (original.scroll) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', original.scroll)
  if (original.client) Object.defineProperty(HTMLElement.prototype, 'clientHeight', original.client)
})

describe('TextoExpandible', () => {
  it('sin recorte no ofrece el botón', () => {
    simular(20, 20)
    render(<TextoExpandible texto="Nombre corto" claseLineas="line-clamp-2" nombre="quién creó la ficha 1" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('con recorte ofrece «Ver más», que abre y cierra el texto completo con teclado o toque y nombra qué abre', () => {
    simular(80, 40)
    render(<TextoExpandible texto="Un nombre larguísimo" claseLineas="line-clamp-2" nombre="quién creó la ficha 1" />)
    const boton = screen.getByRole('button', { name: 'Ver más quién creó la ficha 1' })
    expect(boton.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Un nombre larguísimo').className).toMatch(/line-clamp-2/)
    fireEvent.click(boton)
    expect(screen.getByRole('button', { name: 'Ver menos quién creó la ficha 1' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Un nombre larguísimo').className).not.toMatch(/line-clamp/)
  })
})
