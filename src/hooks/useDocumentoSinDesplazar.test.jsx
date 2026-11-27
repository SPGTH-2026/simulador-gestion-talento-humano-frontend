import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import useDocumentoSinDesplazar from './useDocumentoSinDesplazar'

function Marco({ campo = false }) {
  useDocumentoSinDesplazar()
  return campo ? <input aria-label="campo" /> : <button>boton</button>
}

let documentoMovido
beforeEach(() => {
  vi.useFakeTimers()
  documentoMovido = 80
  // jsdom no desplaza: se simula un documento que el teléfono dejó movido.
  Object.defineProperty(document, 'scrollingElement', {
    configurable: true,
    value: { get scrollTop() { return documentoMovido }, set scrollTop(v) { documentoMovido = v } },
  })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  delete document.scrollingElement
})

describe('useDocumentoSinDesplazar: no compite con el usuario', () => {
  const esperar = () => {
    document.dispatchEvent(new Event('focusout'))
    vi.advanceTimersByTime(200)
  }

  it('no toca el documento con zoom de pellizco', () => {
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: { scale: 2, addEventListener() {}, removeEventListener() {} } })
    render(<Marco />)
    esperar()
    expect(documentoMovido).toBe(80)
    delete window.visualViewport
  })

  it('no toca el documento mientras hay texto seleccionado', () => {
    const { container } = render(<Marco />)
    const rango = document.createRange()
    rango.selectNodeContents(container.querySelector('button'))
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(rango)
    esperar()
    expect(documentoMovido).toBe(80)
    window.getSelection().removeAllRanges()
  })

  it('no toca el documento mientras un dedo sigue apoyado, y sí cuando se suelta', () => {
    render(<Marco />)
    document.dispatchEvent(new Event('touchstart'))
    esperar()
    expect(documentoMovido).toBe(80)
    document.dispatchEvent(new Event('touchend'))
    esperar()
    expect(documentoMovido).toBe(0)
  })

  it('con el documento ya en 0 no hace nada (no genera saltos ni escrituras)', () => {
    documentoMovido = 0
    let escrituras = 0
    Object.defineProperty(document, 'scrollingElement', {
      configurable: true,
      value: { get scrollTop() { return documentoMovido }, set scrollTop(v) { escrituras += 1; documentoMovido = v } },
    })
    render(<Marco />)
    esperar()
    expect(escrituras).toBe(0)
  })

  it('solo mira el documento: el desplazamiento del contenido no lo toca', () => {
    const contenido = document.createElement('main')
    contenido.id = 'contenido'
    contenido.scrollTop = 250
    document.body.appendChild(contenido)
    documentoMovido = 0
    render(<Marco />)
    esperar()
    expect(contenido.scrollTop).toBe(250)
    contenido.remove()
  })
})

describe('useDocumentoSinDesplazar', () => {
  it('devuelve el documento a su sitio cuando se cierra el teclado (ya no hay un campo enfocado)', () => {
    render(<Marco />)
    document.dispatchEvent(new Event('focusout'))
    vi.advanceTimersByTime(200)
    expect(documentoMovido).toBe(0)
  })

  it('respeta el desplazamiento mientras un campo sigue enfocado (para que quede visible con el teclado abierto)', () => {
    const { getByLabelText } = render(<Marco campo />)
    getByLabelText('campo').focus()
    document.dispatchEvent(new Event('focusout'))
    vi.advanceTimersByTime(200)
    expect(documentoMovido).toBe(80)
  })

  it('al desmontar el marco deja de escuchar (no queda nada activo)', () => {
    const { unmount } = render(<Marco />)
    unmount()
    document.dispatchEvent(new Event('focusout'))
    vi.advanceTimersByTime(200)
    expect(documentoMovido).toBe(80)
  })
})
