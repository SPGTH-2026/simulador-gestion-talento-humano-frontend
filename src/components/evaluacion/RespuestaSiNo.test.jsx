import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import RespuestaSiNo from './RespuestaSiNo'
import { CLASE_OPCION_RADIO } from '../../lib/estilos'

afterEach(cleanup)

const radio = (nombre) => screen.getByRole('radio', { name: new RegExp(nombre) })

// Misma pareja de opciones en Skills (Sí/No) y Evaluación (Cumple/No cumple): tres estados por separado.
describe('RespuestaSiNo', () => {
  it('opción elegida: se distingue (marcada) y repetirla no genera cambio', () => {
    const onChange = vi.fn()
    render(<RespuestaSiNo pregunta="¿Declaras «Git»?" valor={false} onChange={onChange} />)

    expect(radio('No').checked).toBe(true)
    expect(radio('Sí').checked).toBe(false)
    fireEvent.click(radio('No'))
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(radio('Sí'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('guardado en curso: ignora cambios, queda ocupado y conserva el foco (no se deshabilita)', () => {
    const onChange = vi.fn()
    const { container } = render(<RespuestaSiNo pregunta="¿Declaras «Git»?" valor={false} onChange={onChange} ocupado />)

    expect(container.querySelector('fieldset').getAttribute('aria-busy')).toBe('true')
    expect(radio('Sí').disabled).toBe(false)
    radio('Sí').focus()
    expect(document.activeElement).toBe(radio('Sí'))
    fireEvent.click(radio('Sí'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('edición bloqueada: la opción bloqueada no responde y las demás siguen funcionando', () => {
    const onChange = vi.fn()
    render(
      <RespuestaSiNo pregunta="¿Cumple «Hoja de vida»?" textoSi="Cumple" textoNo="No cumple" valor={undefined}
        onChange={onChange} deshabilitadoSi />,
    )

    // Un navegador no entrega clics a un radio deshabilitado (jsdom sí los simula), por eso se comprueba el atributo.
    expect(radio('^Cumple').disabled).toBe(true)
    expect(radio('No cumple').disabled).toBe(false)
    fireEvent.click(radio('No cumple'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('los estilos no animan ni dan hover a la opción elegida, a la bloqueada ni a la ocupada', () => {
    // Pulsación (0,96): solo en radios habilitados, no elegidos y sin guardado en curso.
    expect(CLASE_OPCION_RADIO).toContain('[input:enabled:not(:checked,[aria-busy=true]):active+&]:scale-[0.96]')
    expect(CLASE_OPCION_RADIO).toContain('motion-reduce:[input:enabled:not(:checked,[aria-busy=true]):active+&]:scale-100')
    // Hover de acción: ni elegida, ni deshabilitada, ni ocupada.
    expect(CLASE_OPCION_RADIO).toContain('[input:not(:checked,:disabled,[aria-busy=true])+&]:hover:bg-sena-cielo/30')
    // Cursor: normal en la elegida (repetirla no hace nada), «no permitido» en la bloqueada.
    expect(CLASE_OPCION_RADIO).toContain('[input:checked+&]:cursor-default')
    expect(CLASE_OPCION_RADIO).toContain('peer-disabled:cursor-not-allowed')
  })
})
