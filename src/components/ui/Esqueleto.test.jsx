import { afterEach, describe, it, expect } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CargaInicial, EsqueletoDetalle, EsqueletoLista, EsqueletoTabla, EsqueletoTarjetas, Hueco } from './Esqueleto'

afterEach(cleanup)

// Cada esqueleto es UNA región anunciada, con su texto solo para lectores, y sus huecos son decorativos.
const casos = [
  ['EsqueletoLista', <EsqueletoLista key="l" texto="Cargando convocatorias…" />, 'Cargando convocatorias…'],
  ['EsqueletoTabla', <EsqueletoTabla key="t" texto="Cargando candidatos…" />, 'Cargando candidatos…'],
  ['EsqueletoTarjetas', <EsqueletoTarjetas key="c" texto="Cargando postulaciones…" />, 'Cargando postulaciones…'],
  ['EsqueletoDetalle', <EsqueletoDetalle key="d" texto="Cargando detalle…" metricas={3} />, 'Cargando detalle…'],
  ['CargaInicial', <CargaInicial key="i" texto="Cargando ranking…"><Hueco className="h-4 w-10" /></CargaInicial>, 'Cargando ranking…'],
]

describe('Esqueleto', () => {
  it.each(casos)('%s: una sola región de estado, ocupada y con su texto para lectores de pantalla', (_n, elemento, texto) => {
    render(elemento)

    const regiones = screen.getAllByRole('status')
    expect(regiones).toHaveLength(1)
    expect(regiones[0].getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText(texto).className).toContain('sr-only')
  })

  it('el contenido visual es decorativo y no se anima con movimiento reducido', () => {
    const { container } = render(<EsqueletoTabla texto="Cargando candidatos…" filas={2} columnas={3} />)

    // Todo lo visible va dentro de un contenedor aria-hidden: el lector solo oye el texto.
    expect(container.querySelector('[role=status] > [aria-hidden="true"]')).toBeTruthy()
    const huecos = container.querySelectorAll('span.bg-sena-hundido')
    expect(huecos.length).toBeGreaterThan(4)
    huecos.forEach((h) => {
      expect(h.className).toContain('motion-safe:animate-pulse')
      expect(h.className).not.toMatch(/(^|\s)animate-pulse/)
    })
  })

  it('respeta la cantidad pedida de filas, tarjetas y métricas', () => {
    const { container, rerender } = render(<EsqueletoLista texto="x" filas={4} />)
    expect(container.querySelectorAll('li')).toHaveLength(4)

    rerender(<EsqueletoTarjetas texto="x" n={2} />)
    expect(container.querySelectorAll('li')).toHaveLength(2)

    rerender(<EsqueletoDetalle texto="x" metricas={4} bloques={1} />)
    expect(container.querySelectorAll('.grid > div')).toHaveLength(4)
  })
})

describe('Esqueleto: estructura del contenido final', () => {
  it('tarjetas con cantidad impar suman una solo en la banda de dos columnas, para no dejar media fila vacía', () => {
    const { container } = render(<EsqueletoTarjetas texto="x" n={3} />)
    const items = container.querySelectorAll('li')
    expect(items).toHaveLength(4)
    expect(items[3].className).toMatch(/hidden .*@min-\[600px\]:flex .*@min-\[940px\]:hidden/)
    // Cantidad par o una sola columna: sin extra.
    expect(render(<EsqueletoTarjetas texto="x" n={3} unaColumna />).container.querySelectorAll("li")).toHaveLength(3)
  })

  it('la lista con tarjeta recorta su alto (sin crecer) y reserva el pie de paginación', () => {
    const { container } = render(<EsqueletoLista texto="x" filas={8} tarjeta pie listaClassName="max-h-72" />)
    const ul = container.querySelector('ul')
    expect(ul.className).toMatch(/overflow-hidden/)
    expect(ul.className).toMatch(/max-h-72/)
    expect(ul.className).toMatch(/min-h-0/)
    // El pie (texto + dos botones) está fuera de la tarjeta y no se encoge.
    expect(container.querySelectorAll('.grid-cols-2 > span')).toHaveLength(2)
  })

  it('la tabla puede reservar su pie y el detalle usa la misma rejilla de métricas que el resumen real', () => {
    const { container } = render(<EsqueletoTabla texto="x" filas={2} pie />)
    expect(container.querySelector('.mt-4')).toBeTruthy()
    expect(container.querySelector('.mt-4 button')).toBeNull()
    const { container: c2 } = render(<EsqueletoDetalle texto="x" metricas={4} bloques={0} />)
    expect(c2.querySelector('.grid').className).toContain('grid-cols-2')
    expect(c2.querySelector('.grid').className).toContain('gap-y-3')
  })
})

describe('Esqueleto: información conocida y una sola línea de carga', () => {
  it('con encabezados muestra los títulos conocidos (visibles) y solo las filas son esqueleto', () => {
    const { container } = render(
      <EsqueletoTabla
        texto="Cargando candidatos…"
        filas={2}
        encabezados={[{ texto: 'Aspirante' }, { texto: 'Estado documental', clase: 'hidden @min-[720px]:block' }, { texto: 'Acciones', clase: 'invisible' }]}
        plantilla="grid-cols-[minmax(0,1fr)_9rem]"
      />,
    )
    expect(screen.getByText('Aspirante')).toBeTruthy()
    expect(screen.getByText('Estado documental').className).toContain('hidden')
    // Las filas replican las clases de visibilidad de su columna y no repiten los títulos.
    expect(container.querySelectorAll('.divide-y > div')).toHaveLength(2)
    expect(container.querySelectorAll('.divide-y > div:first-child > span')).toHaveLength(3)
    expect(screen.getAllByText('Aspirante')).toHaveLength(1)
  })

  it('el texto de carga del pie es visible pero no duplica el aviso: una sola región de estado', () => {
    const { container } = render(<EsqueletoTabla texto="Cargando aspirantes…" filas={1} pie textoPie="Cargando aspirantes…" />)
    expect(screen.getAllByRole('status')).toHaveLength(1)
    const visible = [...container.querySelectorAll('p')].find((p) => p.textContent.trim() === 'Cargando aspirantes…')
    expect(visible.closest('[aria-hidden="true"]')).toBeTruthy()
    // Mismo formato que la línea de Convocatorias: rueda decorativa + texto, todo fuera del árbol de accesibilidad.
    expect(visible.querySelector('[aria-hidden="true"].animate-spin, [aria-hidden="true"][class*=animate-spin]')).toBeTruthy()
  })
})
