import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// El título y la ayuda no dependen de la API: están siempre, y el esqueleto sustituye solo lo que llega del servidor.
vi.mock('../../api/postulaciones', () => ({ listaMisPostulaciones: vi.fn() }))
import { listaMisPostulaciones } from '../../api/postulaciones'
import MisDocumentos from './MisDocumentos'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const montar = () => render(<MemoryRouter><MisDocumentos /></MemoryRouter>)
const titulo = () => screen.getByRole('heading', { name: 'Mis documentos' })

describe('Mis documentos', () => {
  it('mientras carga conserva el título y la ayuda y muestra el esqueleto solo del contenido', () => {
    listaMisPostulaciones.mockReturnValue(new Promise(() => {}))
    montar()

    expect(titulo()).toBeTruthy()
    expect(screen.getByText(/Gestiona los documentos de cada postulación/)).toBeTruthy()
    expect(screen.getByText('Cargando tus postulaciones…')).toBeTruthy()
    expect(screen.getByText('¿Cómo funciona?')).toBeTruthy()
  })

  it('al fallar conserva la cabecera, ofrece Reintentar y se recupera', async () => {
    listaMisPostulaciones.mockRejectedValueOnce(new Error('red'))
    listaMisPostulaciones.mockResolvedValueOnce({ data: [{ id: 5, estado: { codigo: 'postulada', nombre: 'Postulada' }, convocatoria: { nombre: 'Conv de prueba' }, fecha_postulacion: '2026-11-01' }] })
    montar()

    expect(await screen.findByText('No se pudieron cargar tus postulaciones.')).toBeTruthy()
    expect(titulo()).toBeTruthy()
    expect(screen.queryByText('Cargando tus postulaciones…')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Conv de prueba')).toBeTruthy()
    await waitFor(() => expect(titulo()).toBeTruthy())
  })

  it('sin resultados conserva la cabecera y muestra el estado vacío', async () => {
    listaMisPostulaciones.mockResolvedValue({ data: [] })
    montar()

    expect(await screen.findByText('Sin postulaciones')).toBeTruthy()
    expect(titulo()).toBeTruthy()
    expect(screen.queryByText('¿Cómo funciona?')).toBeNull()
  })
})
