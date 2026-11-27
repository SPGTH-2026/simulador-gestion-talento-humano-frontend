import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import useScrollPorRuta from './useScrollPorRuta'

// Marco mínimo: un contenedor #contenido con desplazamiento propio y las pantallas de un listado, su detalle y otra pantalla.
let altoContenido
function Marco() {
  useScrollPorRuta()
  return (
    <main id="contenido">
      <Routes>
        <Route path="/listado" element={<><p>Listado</p><Link to="/detalle">ir al detalle</Link><Link to="/otra">ir a otra</Link><Link to="/listado?pagina=2">pagina 2</Link></>} />
        <Route path="/detalle" element={<><p>Detalle</p><Link to="/listado">volver al listado</Link><Atras /></>} />
        <Route path="/otra" element={<p>Otra pantalla</p>} />
      </Routes>
    </main>
  )
}
function Atras() {
  const navegar = useNavigate()
  return <button onClick={() => navegar(-1)}>atras</button>
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'Date'] })
  altoContenido = 5000
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get: () => altoContenido })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 700 })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  delete HTMLElement.prototype.scrollHeight
  delete HTMLElement.prototype.clientHeight
})

const montar = () =>
  render(
    <MemoryRouter initialEntries={['/listado']}>
      <Marco />
    </MemoryRouter>,
  )
const contenido = () => document.getElementById('contenido')
const desplazar = (top) => {
  contenido().scrollTop = top
  fireEvent.scroll(contenido())
}
const ir = (nombre) => {
  fireEvent.click(screen.getByText(nombre))
  act(() => vi.advanceTimersByTime(50))
}

describe('useScrollPorRuta', () => {
  it('una pantalla nueva empieza arriba aunque la anterior estuviera desplazada', () => {
    montar()
    desplazar(900)
    ir('ir a otra')
    expect(screen.getByText('Otra pantalla')).toBeTruthy()
    expect(contenido().scrollTop).toBe(0)
  })

  it('«volver al listado» desde un detalle recupera la posición que tenía el listado', () => {
    montar()
    desplazar(400)
    ir('ir al detalle')
    expect(contenido().scrollTop).toBe(0)
    ir('volver al listado')
    expect(screen.getByText('Listado')).toBeTruthy()
    expect(contenido().scrollTop).toBe(400)
  })

  it('atrás del navegador recupera la posición de esa entrada del historial', () => {
    montar()
    desplazar(650)
    ir('ir al detalle')
    desplazar(120)
    ir('atras')
    expect(screen.getByText('Listado')).toBeTruthy()
    expect(contenido().scrollTop).toBe(650)
  })

  it('un cambio que solo modifica la búsqueda (filtros, páginas) no mueve la posición', () => {
    montar()
    desplazar(300)
    ir('pagina 2')
    expect(contenido().scrollTop).toBe(300)
  })

  it('espera a que llegue el contenido y lo recupera cuando ya es lo bastante alto', () => {
    montar()
    desplazar(1200)
    ir('ir al detalle')
    altoContenido = 300 // el listado vuelve cargando: todavía corto
    ir('volver al listado')
    expect(contenido().scrollTop).not.toBe(1200)
    altoContenido = 5000
    act(() => vi.advanceTimersByTime(100))
    expect(contenido().scrollTop).toBe(1200)
  })

  it('si la persona se desplaza mientras tanto, no se le quita el control', () => {
    montar()
    desplazar(1200)
    ir('ir al detalle')
    altoContenido = 300
    ir('volver al listado')
    fireEvent.wheel(contenido())
    contenido().scrollTop = 40
    altoContenido = 5000
    act(() => vi.advanceTimersByTime(300))
    expect(contenido().scrollTop).toBe(40)
  })
})
