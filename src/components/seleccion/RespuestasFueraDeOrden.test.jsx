import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'

// Cambiar de convocatoria con una respuesta lenta en vuelo no debe mezclar datos: lo que llega tarde de la convocatoria
// anterior se descarta (cada panel nace de cero por 'key' y los hooks guardan lo leído junto a su ID).
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: { role: 'instructor' }, can: () => true }) }))
vi.mock('../../api/seleccion', () => ({
  obtenerConfiguracion: vi.fn(),
  candidatosConvocatoria: vi.fn(),
}))

import { candidatosConvocatoria, obtenerConfiguracion } from '../../api/seleccion'
import useModalidadConvocatoria from '../../hooks/useModalidadConvocatoria'
import PanelCandidatos from './PanelCandidatos'

afterEach(cleanup)
beforeEach(() => vi.clearAllMocks())

// Promesa que se resuelve a mano, para controlar el orden de llegada.
const diferida = () => {
  let resolver
  const promesa = new Promise((res) => {
    resolver = res
  })
  return { promesa, resolver }
}

describe('useModalidadConvocatoria con respuestas fuera de orden', () => {
  it('la respuesta tardía de la convocatoria anterior nunca se ve en la actual', async () => {
    const a = diferida()
    const b = diferida()
    obtenerConfiguracion.mockImplementation((id) => (String(id) === '107' ? a.promesa : b.promesa))

    const { result, rerender } = renderHook(({ id }) => useModalidadConvocatoria(id), { initialProps: { id: '107' } })
    expect(result.current.fase).toBe('cargando')

    // Se cambia a 108 con la de 107 aún sin llegar.
    rerender({ id: '108' })
    expect(result.current.fase).toBe('cargando')

    // Llega primero la de 108 y después, tarde, la de 107.
    await act(async () => b.resolver({ data: { configurada: true, opcion: 'sin_actividades' } }))
    await waitFor(() => expect(result.current.fase).toBe('listo'))
    expect(result.current.opcion).toBe('sin_actividades')

    await act(async () => a.resolver({ data: { configurada: true, opcion: 'ambas' } }))
    expect(result.current.opcion).toBe('sin_actividades')
  })

  it('si la de la anterior llega después de cambiar, tampoco rellena el hueco mientras carga la nueva', async () => {
    const a = diferida()
    const b = diferida()
    obtenerConfiguracion.mockImplementation((id) => (String(id) === '107' ? a.promesa : b.promesa))

    const { result, rerender } = renderHook(({ id }) => useModalidadConvocatoria(id), { initialProps: { id: '107' } })
    rerender({ id: '108' })
    await act(async () => a.resolver({ data: { configurada: true, opcion: 'ambas' } }))

    // 108 sigue pendiente: no hay modalidad que mostrar (ni la de 107).
    expect(result.current.fase).toBe('cargando')
    expect(result.current.opcion).toBeNull()
  })
})

describe('PanelCandidatos con respuestas fuera de orden', () => {
  const fila = (id, aspirante) => ({ id, aspirante, estado_documental: 'habilitado', cumplimiento: 100 })

  it('al cambiar de convocatoria (key) solo se ven los candidatos de la actual', async () => {
    const a = diferida()
    const b = diferida()
    candidatosConvocatoria.mockImplementation((id) => (String(id) === '107' ? a.promesa : b.promesa))

    const vista = (id) => <PanelCandidatos key={id} convocatoriaId={id} activo />
    const { rerender } = render(vista('107'))
    expect(screen.getAllByText('Cargando candidatos…').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('status')).toHaveLength(1)

    rerender(vista('108'))
    await act(async () => b.resolver({ data: [fila(2, 'Candidata de la 108')], meta: { current_page: 1, last_page: 1, total: 1, per_page: 10 } }))
    expect(await screen.findByText('Candidata de la 108')).toBeTruthy()

    // La respuesta lenta de la 107 llega al final y se descarta.
    await act(async () => a.resolver({ data: [fila(1, 'Candidato de la 107')], meta: { current_page: 1, last_page: 1, total: 1, per_page: 10 } }))
    expect(screen.queryByText('Candidato de la 107')).toBeNull()
    expect(screen.getByText('Candidata de la 108')).toBeTruthy()
  })
})
