import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AvisosRanking from './ranking/AvisosRanking'
import ChipModalidad from './ChipModalidad'
import { Metrica, ResumenSeleccion } from './ResumenSeleccion'

afterEach(cleanup)

describe('ChipModalidad', () => {
  it('distingue una convocatoria sin configurar de una configurada «Sin actividades»', () => {
    const { rerender } = render(<ChipModalidad fase="listo" configurada={false} opcion={null} />)
    expect(screen.getByText('Modalidad: sin configurar')).toBeTruthy()

    rerender(<ChipModalidad fase="listo" configurada opcion="sin_actividades" />)
    expect(screen.getByText(/Modalidad: sin actividades/i)).toBeTruthy()
    expect(screen.queryByText(/sin configurar/i)).toBeNull()
  })

  it('muestra la modalidad con actividades', () => {
    render(<ChipModalidad fase="listo" configurada opcion="ambas" />)
    expect(screen.getByText(/^Modalidad: /)).toBeTruthy()
    expect(screen.queryByText(/sin configurar/i)).toBeNull()
  })

  it('no afirma nada si la consulta falló y reserva el hueco mientras carga', () => {
    const { container, rerender } = render(<ChipModalidad fase="error" configurada={false} opcion={null} />)
    expect(container.innerHTML).toBe('')

    rerender(<ChipModalidad fase="cargando" configurada={false} opcion={null} />)
    expect(screen.queryByText(/Modalidad/)).toBeNull()
    expect(container.firstChild.getAttribute('aria-hidden')).toBe('true')
  })
})

describe('AvisosRanking', () => {
  const avisos = [
    { tono: 'aviso', texto: 'La lista requiere revisión.', enlace: { to: '/x', texto: 'Ver la lista' } },
    { tono: 'info', texto: 'Sin actividades: elige a mano.' },
    { tono: 'exito', texto: 'Lista vigente · Al día' },
  ]

  it('separa lo que pide intervención (caja ámbar) de lo rutinario (líneas sin caja)', () => {
    render(
      <MemoryRouter>
        <AvisosRanking avisos={avisos} />
      </MemoryRouter>,
    )
    const alerta = screen.getByText('La lista requiere revisión.').closest('ul')
    expect(alerta.className).toMatch(/bg-aviso/)
    expect(screen.getByRole('link', { name: 'Ver la lista' }).getAttribute('href')).toBe('/x')

    const rutina = screen.getByText('Sin actividades: elige a mano.').closest('ul')
    expect(rutina).not.toBe(alerta)
    expect(rutina.className).not.toMatch(/bg-aviso/)
    expect(rutina.contains(screen.getByText('Lista vigente · Al día'))).toBe(true)
  })

  it('sin alertas no dibuja la caja ámbar', () => {
    const { container } = render(
      <MemoryRouter>
        <AvisosRanking avisos={avisos.slice(1)} />
      </MemoryRouter>,
    )
    expect(container.querySelector('.bg-aviso\\/10')).toBeNull()
  })
})

describe('ResumenSeleccion', () => {
  it('es una región con cada cifra como término y valor', () => {
    render(
      <ResumenSeleccion etiqueta="Cifras">
        <Metrica titulo="Vacantes">3</Metrica>
        <Metrica titulo="Cupos">1</Metrica>
      </ResumenSeleccion>,
    )
    expect(screen.getByRole('region', { name: 'Cifras' })).toBeTruthy()
    expect(screen.getByText('Vacantes').tagName).toBe('DT')
    expect(screen.getByText('3').tagName).toBe('DD')
  })
})
