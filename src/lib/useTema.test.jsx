import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'

// El módulo guarda el estado en memoria: cada prueba carga una copia limpia.
async function cargarHook() {
  vi.resetModules()
  return import('./useTema')
}

afterEach(cleanup)

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
})

describe('useTema', () => {
  it('dos componentes comparten el mismo tema: alternar en uno actualiza al otro', async () => {
    const { useTema } = await cargarHook()

    function Boton() {
      const { alternar } = useTema()
      return <button onClick={alternar}>cambiar</button>
    }
    function Etiqueta() {
      const { oscuro } = useTema()
      return <span>{oscuro ? 'oscuro' : 'claro'}</span>
    }

    render(
      <>
        <Boton />
        <Etiqueta />
      </>,
    )

    expect(screen.getByText('claro')).toBeTruthy()
    fireEvent.click(screen.getByText('cambiar'))
    expect(screen.getByText('oscuro')).toBeTruthy()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('spgth-tema')).toBe('oscuro')
  })

  it('una elección manual deja de seguir al sistema', async () => {
    const { useTema } = await cargarHook()

    function Uno() {
      const { siguiendo, alternar } = useTema()
      return (
        <>
          <span>{siguiendo ? 'sigue' : 'manual'}</span>
          <button onClick={alternar}>cambiar</button>
        </>
      )
    }

    render(<Uno />)
    expect(screen.getByText('sigue')).toBeTruthy()
    fireEvent.click(screen.getByText('cambiar'))
    expect(screen.getByText('manual')).toBeTruthy()
  })
})
