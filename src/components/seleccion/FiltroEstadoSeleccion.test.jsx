import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'

// El filtro de estado es común a Preselección, Ranking y Decidir: la URL manda (atrás/adelante), se recuerda en la pestaña para el
// salto entre submódulos, reinicia la paginación y no quita la convocatoria abierta ni cambia lo que permite cada estado.
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { role: 'instructor' }, can: () => true }) }))
vi.mock('../../api/seleccion', () => ({ listaConvocatoriasSeleccion: vi.fn() }))
vi.mock('./PanelRanking', () => ({ default: () => <p>panel ranking</p> }))
vi.mock('./PanelFinalistas', () => ({ default: () => <p>panel finalistas</p> }))
vi.mock('./PanelDecisiones', () => ({ default: ({ enProceso }) => <p>panel decisiones: {String(enProceso)}</p> }))
vi.mock('./ComparadorCandidatos', () => ({ default: () => null }))
vi.mock('../../hooks/useModalidadConvocatoria', () => ({ default: () => ({ fase: 'error', configurada: false, opcion: null, recargar: () => {} }) }))

import { listaConvocatoriasSeleccion } from '../../api/seleccion'
import ListaConvocatorias from './ListaConvocatorias'
import SeleccionRanking from '../../pages/seleccion/SeleccionRanking'
import SeleccionDecidir from '../../pages/seleccion/SeleccionDecidir'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  Element.prototype.scrollIntoView = vi.fn()
})

const fila = (id, estado = 'en_proceso') => ({ id, nombre: `Convocatoria ${id}`, codigo: `C-${id}`, vacantes: 1, estado: { codigo: estado, nombre: estado === 'cerrada' ? 'Cerrada' : 'En proceso' }, candidatos: 2 })
const pagina = (data, extra = {}) => ({ data, meta: { current_page: 1, last_page: 1, per_page: 20, total: data.length, ...extra } })

function Ubicacion() {
  const l = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-testid="url">{l.pathname + l.search}</output>
      <button onClick={() => navigate(-1)}>atras</button>
      <button onClick={() => navigate(1)}>adelante</button>
    </>
  )
}

describe('ListaConvocatorias: controles y filtro', () => {
  it('«Estado» y «Convocatoria» tienen etiqueta visible y accesible, y la misma caja de 44 px', async () => {
    listaConvocatoriasSeleccion.mockResolvedValue(pagina([fila(1)]))
    render(<ListaConvocatorias seleccionadaId="1" etiquetaSeleccionada="Convocatoria 1" onElegir={() => {}} filtroEstado="" onFiltroEstado={() => {}} />)

    const estado = screen.getByLabelText('Estado')
    const convocatoria = screen.getByLabelText('Convocatoria')
    expect(estado.tagName).toBe('SELECT')
    expect(convocatoria.tagName).toBe('BUTTON')
    for (const control of [estado, convocatoria]) {
      expect(control.className).toContain('min-h-11')
      expect(control.className).toContain('rounded-md')
      expect(control.className).toContain('border-sena-azul/60')
      expect(control.className).toContain('text-sm')
    }
    // Etiquetas visibles (texto), no solo atributos.
    expect(screen.getByText('Estado').closest('label')).toBeTruthy()
    expect(screen.getAllByText('Convocatoria').find((e) => e.closest('label'))).toBeTruthy()
    await screen.findAllByText('Convocatoria 1')
  })

  it('pide al servidor solo el estado elegido y vuelve a la primera página al cambiarlo', async () => {
    listaConvocatoriasSeleccion.mockResolvedValue(pagina([fila(1)], { last_page: 3 }))
    const { rerender } = render(<ListaConvocatorias seleccionadaId="" onElegir={() => {}} filtroEstado="" onFiltroEstado={() => {}} />)
    await screen.findByText('Convocatoria 1')

    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    await waitFor(() => expect(listaConvocatoriasSeleccion).toHaveBeenLastCalledWith({ page: 2 }))

    rerender(<ListaConvocatorias seleccionadaId="" onElegir={() => {}} filtroEstado="cerrada" onFiltroEstado={() => {}} />)
    await waitFor(() => expect(listaConvocatoriasSeleccion).toHaveBeenLastCalledWith({ page: 1, estado: 'cerrada' }))
  })

  it('sin resultados lo dice y ofrece volver a «Todos los estados»; mientras carga no muestra filas de otro filtro', async () => {
    let resolver
    listaConvocatoriasSeleccion.mockResolvedValueOnce(pagina([fila(1)])).mockReturnValueOnce(new Promise((r) => { resolver = r }))
    const { rerender } = render(<ListaConvocatorias seleccionadaId="" onElegir={() => {}} filtroEstado="" onFiltroEstado={() => {}} />)
    await screen.findByText('Convocatoria 1')

    rerender(<ListaConvocatorias seleccionadaId="" onElegir={() => {}} filtroEstado="publicada" onFiltroEstado={() => {}} />)
    expect(screen.queryByText('Convocatoria 1')).toBeNull()
    expect(screen.getAllByText('Cargando convocatorias…').length).toBeGreaterThan(0)
    // Un solo aviso para lectores de pantalla: la región de carga; el texto visible del pie es decorativo.
    expect(screen.getAllByRole('status')).toHaveLength(1)

    await act(async () => resolver(pagina([])))
    expect(await screen.findByText('Ninguna convocatoria con ese estado')).toBeTruthy()
    expect(screen.getByText(/Todos los estados/, { selector: 'p' })).toBeTruthy()
  })

  it('si falla muestra el error y Reintentar vuelve a pedirlo con el mismo filtro', async () => {
    listaConvocatoriasSeleccion.mockRejectedValueOnce(new Error('red')).mockResolvedValueOnce(pagina([fila(7, 'cerrada')]))
    render(<ListaConvocatorias seleccionadaId="" onElegir={() => {}} filtroEstado="cerrada" onFiltroEstado={() => {}} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Convocatoria 7')).toBeTruthy()
    expect(listaConvocatoriasSeleccion).toHaveBeenLastCalledWith({ page: 1, estado: 'cerrada' })
  })

  it('la convocatoria abierta se conserva si el filtro no la incluye y solo se avisa', async () => {
    listaConvocatoriasSeleccion.mockResolvedValue(pagina([fila(9, 'cerrada')]))
    render(<ListaConvocatorias seleccionadaId="1" etiquetaSeleccionada="Convocatoria 1" codigoEstadoSeleccionada="en_proceso" filtroEstado="cerrada" onElegir={() => {}} onFiltroEstado={() => {}} />)

    expect(await screen.findByText(/no coincide con este filtro/)).toBeTruthy()
    // Sigue siendo la elegida en el botón de navegación.
    expect(screen.getByLabelText('Convocatoria').textContent).toContain('Convocatoria 1')
  })
})

describe('Filtro de estado en Ranking y Decidir', () => {
  it.each([
    ['Ranking', <SeleccionRanking key="r" />, '/seleccion'],
    ['Decidir', <SeleccionDecidir key="d" />, '/seleccion/decidir'],
  ])('%s: aplica el filtro de la URL, lo conserva con los demás parámetros y responde a atrás/adelante', async (_n, pantalla, ruta) => {
    listaConvocatoriasSeleccion.mockImplementation(async ({ estado, convocatoria }) =>
      convocatoria ? pagina([fila(5, 'en_proceso')]) : pagina([fila(estado === 'cerrada' ? 8 : 1, estado ?? 'en_proceso')]),
    )
    render(
      <MemoryRouter initialEntries={[`${ruta}?convocatoria=5&estado=cerrada`]}>
        {pantalla}
        <Ubicacion />
      </MemoryRouter>,
    )

    expect((await screen.findByLabelText('Estado')).value).toBe('cerrada')
    await waitFor(() => expect(listaConvocatoriasSeleccion).toHaveBeenCalledWith({ page: 1, estado: 'cerrada' }))
    // La convocatoria abierta (en proceso) fuera del filtro «cerrada» sigue abierta.
    expect(await screen.findByText(/no coincide con este filtro/)).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: '' } })
    await waitFor(() => expect(screen.getByTestId('url').textContent).toBe(`${ruta}?convocatoria=5`))
    expect(screen.getByLabelText('Estado').value).toBe('')
  })

  it('Decidir: abrir una convocatoria fuera del filtro no habilita acciones que su estado no permite (sigue sin «en proceso» = false)', async () => {
    listaConvocatoriasSeleccion.mockImplementation(async ({ convocatoria }) => pagina([fila(convocatoria ?? 3, 'cerrada')]))
    render(
      <MemoryRouter initialEntries={['/seleccion/decidir?convocatoria=3&estado=en_proceso']}>
        <SeleccionDecidir />
      </MemoryRouter>,
    )

    expect(await screen.findByText('panel decisiones: false')).toBeTruthy()
  })

  it('el filtro recordado se aplica al entrar a otro submódulo sin parámetros, y una URL con parámetro manda', async () => {
    listaConvocatoriasSeleccion.mockResolvedValue(pagina([fila(1)]))
    sessionStorage.setItem('spgth.seleccion.estado', 'publicada')
    const { unmount } = render(<MemoryRouter initialEntries={['/seleccion/decidir']}><SeleccionDecidir /><Ubicacion /></MemoryRouter>)
    await waitFor(() => expect(screen.getByTestId('url').textContent).toBe('/seleccion/decidir?estado=publicada'))
    expect(screen.getByLabelText('Estado').value).toBe('publicada')
    unmount()

    render(<MemoryRouter initialEntries={['/seleccion?estado=cerrada']}><SeleccionRanking /><Ubicacion /></MemoryRouter>)
    expect((await screen.findByLabelText('Estado')).value).toBe('cerrada')
    // Elegir «Todos» también se recuerda: el próximo submódulo entra sin filtro.
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: '' } })
    expect(sessionStorage.getItem('spgth.seleccion.estado')).toBeNull()
  })

  it('un valor desconocido en la URL se trata como «Todos los estados»', async () => {
    listaConvocatoriasSeleccion.mockResolvedValue(pagina([fila(1)]))
    render(<MemoryRouter initialEntries={['/seleccion?estado=inventado']}><SeleccionRanking /></MemoryRouter>)

    expect((await screen.findByLabelText('Estado')).value).toBe('')
    await waitFor(() => expect(listaConvocatoriasSeleccion).toHaveBeenCalledWith({ page: 1 }))
  })

  it('atrás y adelante recorren los cambios de convocatoria con su filtro', async () => {
    listaConvocatoriasSeleccion.mockImplementation(async ({ convocatoria }) => pagina([fila(convocatoria ?? 1)]))
    render(
      <MemoryRouter initialEntries={['/seleccion?estado=cerrada', '/seleccion?estado=publicada']} initialIndex={1}>
        <SeleccionRanking />
        <Ubicacion />
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByLabelText('Estado').value).toBe('publicada'))
    fireEvent.click(screen.getByText('atras'))
    await waitFor(() => expect(screen.getByLabelText('Estado').value).toBe('cerrada'))
    fireEvent.click(screen.getByText('adelante'))
    await waitFor(() => expect(screen.getByLabelText('Estado').value).toBe('publicada'))
  })
})

describe('Teclado en «Convocatoria» (pantallas estrechas)', () => {
  beforeEach(() => {
    // jsdom no calcula diseño: se simula que el botón es visible (como en pantallas estrechas).
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', { configurable: true, get() { return this.parentNode } })
  })
  afterEach(() => {
    delete HTMLElement.prototype.offsetParent
  })

  it('al elegir una convocatoria la lista se pliega y el foco vuelve al botón, sin perderse', async () => {
    listaConvocatoriasSeleccion.mockResolvedValue(pagina([fila(1), fila(2)]))
    const elegida = vi.fn()
    render(<ListaConvocatorias seleccionadaId="" onElegir={elegida} filtroEstado="" onFiltroEstado={() => {}} />)

    const boton = screen.getByLabelText('Convocatoria')
    expect(boton.getAttribute('aria-expanded')).toBe('true') // sin convocatoria elegida empieza abierta
    const fila2 = (await screen.findAllByRole('button', { name: /Convocatoria 2/ })).find((b) => b !== boton)
    fila2.focus()
    fireEvent.click(fila2)

    expect(elegida).toHaveBeenCalled()
    expect(boton.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(boton)
  })

  it('Escape dentro de la lista abierta la pliega y devuelve el foco al botón; fuera de ella no hace nada', async () => {
    listaConvocatoriasSeleccion.mockResolvedValue(pagina([fila(1)]))
    render(<ListaConvocatorias seleccionadaId="" onElegir={() => {}} filtroEstado="" onFiltroEstado={() => {}} />)

    const boton = screen.getByLabelText('Convocatoria')
    const fila1 = (await screen.findAllByRole('button', { name: /Convocatoria 1/ })).find((b) => b !== boton)
    fila1.focus()
    fireEvent.keyDown(fila1, { key: 'Escape' })

    expect(boton.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(boton)
    // Con la lista ya plegada, Escape en el botón no cambia nada.
    fireEvent.keyDown(boton, { key: 'Escape' })
    expect(boton.getAttribute('aria-expanded')).toBe('false')
  })
})
