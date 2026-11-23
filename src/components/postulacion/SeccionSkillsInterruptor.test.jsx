import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

// Skills del aspirante con interruptor: texto inicial único, confirmación «Quitar skill» que dice qué se elimina (y que
// Cancelar conserva todo), indicador junto al control mientras guarda y error junto a la fila.
const confirmar = vi.hoisted(() => vi.fn())
vi.mock('../../hooks/useConfirmacion', () => ({ useConfirmacion: () => confirmar }))
vi.mock('../../api/postulacionesDocumentos', async (original) => ({
  ...(await original()),
  declararSkill: vi.fn(),
  eliminarSkill: vi.fn(),
}))

import { declararSkill, eliminarSkill } from '../../api/postulacionesDocumentos'
import SeccionSkills from './SeccionSkills'

afterEach(cleanup)
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

const sinCertificado = { id: 27, nombre: 'Adaptabilidad', origen: 'convocatoria', convocatoria_skill_id: 21, certificado: null }
const conCertificado = { ...sinCertificado, certificado: { id: 3, nombre_original: 'curso.pdf' } }
const vistaCon = (skills) => ({
  postulacion: { id: 7 },
  skills,
  skills_convocatoria: [{ id: 21, nombre: 'Adaptabilidad' }, { id: 22, nombre: 'Excel' }],
})
const montar = (skills, extra = {}) =>
  render(
    <SeccionSkills
      vista={vistaCon(skills)}
      editable
      asegurar={() => Promise.resolve({ postulacionId: 7, estado: vistaCon(skills) })}
      onRecargar={vi.fn(() => Promise.resolve())}
      {...extra}
    />,
  )
const switchDe = (nombre) => screen.getByRole('switch', { name: nombre })

describe('SeccionSkills con interruptor', () => {
  it('explica una sola vez al inicio cómo declarar y no menciona Sí/No', () => {
    montar([])
    expect(screen.getByText(/Activa las habilidades que deseas declarar/)).toBeTruthy()
    expect(screen.getByText(/Son opcionales y no\s+bloquean el envío de tu postulación\. Puedes adjuntar un certificado\./)).toBeTruthy()
    expect(screen.queryByText(/"Sí"/)).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
  })

  it('el interruptor activo refleja la declaración y muestra la franja del certificado', () => {
    montar([sinCertificado])
    expect(switchDe('Adaptabilidad').getAttribute('aria-checked')).toBe('true')
    expect(switchDe('Excel').getAttribute('aria-checked')).toBe('false')
    expect(screen.getByText(/Certificado opcional: aún no cargaste uno/)).toBeTruthy()
    expect(screen.getAllByText(/Certificado opcional/)).toHaveLength(1)
  })

  it('al desactivar pide confirmar y explica qué se elimina; si tiene certificado, lo dice', async () => {
    confirmar.mockResolvedValue(false)
    montar([conCertificado])

    fireEvent.click(switchDe('Adaptabilidad'))
    await waitFor(() => expect(confirmar).toHaveBeenCalled())
    const dialogo = confirmar.mock.calls[0][0]
    expect(dialogo.titulo).toBe('Quitar skill')
    expect(dialogo.mensaje).toContain('Adaptabilidad')
    expect(dialogo.mensaje).toContain('también se eliminará el certificado')
    expect(dialogo.mensaje).toContain('curso.pdf')
  })

  it('sin certificado el mensaje no habla de archivos', async () => {
    confirmar.mockResolvedValue(false)
    montar([sinCertificado])
    fireEvent.click(switchDe('Adaptabilidad'))
    await waitFor(() => expect(confirmar).toHaveBeenCalled())
    expect(confirmar.mock.calls[0][0].mensaje).not.toContain('certificado')
  })

  it('Cancelar conserva la selección y el certificado: no se pide nada al servidor', async () => {
    confirmar.mockResolvedValue(false)
    montar([conCertificado])

    fireEvent.click(switchDe('Adaptabilidad'))
    await waitFor(() => expect(confirmar).toHaveBeenCalled())
    expect(eliminarSkill).not.toHaveBeenCalled()
    expect(switchDe('Adaptabilidad').getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('curso.pdf')).toBeTruthy()
  })

  it('guardando: solo se anuncia (texto para lector de pantalla), queda ocupado y el resto bloqueado sin perder el foco', async () => {
    let terminar
    declararSkill.mockReturnValue(new Promise((r) => { terminar = r }))
    montar([])

    switchDe('Excel').focus()
    fireEvent.click(switchDe('Excel'))
    // La región de estado existe siempre; mientras guarda dice «Guardando…», pero no se ve (sr-only: sin salto de distribución).
    const anuncio = await screen.findByText('Guardando…')
    expect(anuncio.getAttribute('role')).toBe('status')
    expect(anuncio.className).toContain('sr-only')
    expect(switchDe('Excel').getAttribute('aria-busy')).toBe('true')
    expect(document.activeElement).toBe(switchDe('Excel'))
    // Las demás filas se bloquean (aria-disabled) sin quitarles el foco ni dejar iniciar otra operación.
    expect(switchDe('Adaptabilidad').getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(switchDe('Adaptabilidad'))
    expect(declararSkill).toHaveBeenCalledTimes(1)
    terminar({})
  })

  it('si falla, el error aparece junto a la fila y el estado real se recupera', async () => {
    declararSkill.mockRejectedValue(new Error('Sin conexión'))
    const onRecargar = vi.fn(() => Promise.resolve())
    montar([], { onRecargar })

    fireEvent.click(switchDe('Excel'))
    const alerta = await screen.findByRole('alert')
    expect(alerta.textContent).toContain('No pudimos conectarnos')
    // El error vive dentro de la fila de Excel, no al final de la sección.
    expect(alerta.closest('li').textContent).toContain('Excel')
    expect(onRecargar).toHaveBeenCalled()
    expect(switchDe('Excel').getAttribute('aria-checked')).toBe('false')
    await waitFor(() => expect(switchDe('Excel').getAttribute('aria-busy')).toBeNull())
  })

  it('sin permiso de edición todos los interruptores quedan bloqueados', () => {
    montar([sinCertificado], { editable: false })
    expect(switchDe('Adaptabilidad').getAttribute('aria-disabled')).toBe('true')
    expect(switchDe('Excel').getAttribute('aria-disabled')).toBe('true')
  })
})
