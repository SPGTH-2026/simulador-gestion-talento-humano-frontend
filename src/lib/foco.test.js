import { describe, expect, it, vi } from 'vitest'
import { enfocar, esEditable } from './foco'

const crear = (html) => {
  const cont = document.createElement('div')
  cont.innerHTML = html
  document.body.appendChild(cont)
  return cont.firstElementChild
}

describe('enfocar', () => {
  it('no mueve la página al enfocar botones, enlaces y contenedores', () => {
    for (const html of ['<button>a</button>', '<a href="#x">a</a>', '<div tabindex="-1"></div>', '<input type="checkbox">']) {
      const el = crear(html)
      const espia = vi.spyOn(el, 'focus')
      enfocar(el)
      expect(espia).toHaveBeenCalledWith({ preventScroll: true })
    }
  })

  it('deja el comportamiento normal en campos editables para que sigan visibles con el teclado', () => {
    for (const html of ['<input type="text">', '<input>', '<textarea></textarea>', '<select></select>', '<div contenteditable="true"></div>']) {
      const el = crear(html)
      const espia = vi.spyOn(el, 'focus')
      enfocar(el)
      expect(espia).toHaveBeenCalledWith()
      expect(esEditable(el)).toBe(true)
    }
  })

  it('ignora elementos nulos', () => {
    expect(() => enfocar(null)).not.toThrow()
  })
})
