import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(cleanup)

vi.mock('../../api/convocatorias', () => ({
  listaParametros: vi.fn().mockResolvedValue({ data: [] }),
}))
vi.mock('../../api/ubicaciones', () => ({
  listaDepartamentos: vi.fn().mockResolvedValue([
    { codigo: '05', nombre: 'Antioquia' },
    { codigo: '13', nombre: 'Bolívar' },
  ]),
  listaMunicipios: vi.fn(async (departamento) =>
    departamento === '05' ? [{ codigo: '05001', nombre: 'Medellín' }, { codigo: '05088', nombre: 'Bello' }] : [{ codigo: '13001', nombre: 'Cartagena de Indias' }],
  ),
}))
vi.mock('../../api/postulacionesDocumentos', () => ({
  guardarDatosPersonales: vi.fn(),
}))

import { guardarDatosPersonales } from '../../api/postulacionesDocumentos'
import { listaMunicipios } from '../../api/ubicaciones'
import CamposDatosPersonales from './CamposDatosPersonales'
import { useSeccionDatosPersonales } from './useSeccionDatosPersonales'

// La sección de datos personales lleva dentro el bloque de autorización: se monta tal como en la página.
function SeccionDatosPersonales({ editable, motivoBloqueo, onContinuar, ...resto }) {
  const d = useSeccionDatosPersonales({ editable, ...resto })
  return <CamposDatosPersonales d={d} editable={editable} motivoBloqueo={motivoBloqueo} onContinuar={onContinuar} />
}

const anios = (n) => {
  const f = new Date()
  f.setFullYear(f.getFullYear() - n)
  return f.toISOString().slice(0, 10)
}

const props = () => ({
  datos: null,
  editable: true,
  asegurar: vi.fn().mockResolvedValue({ postulacionId: 7 }),
  onRecargar: vi.fn().mockResolvedValue(undefined),
  onError: vi.fn(),
})

const fecha = () => screen.getByLabelText(/fecha de nacimiento/i)
const autorizacion = () => screen.getByRole('checkbox', { name: /autorizo el tratamiento/i })

describe('SeccionDatosPersonales', () => {
  it('lleva la autorización dentro de datos personales y ningún botón de guardar', () => {
    render(<SeccionDatosPersonales {...props()} />)

    expect(screen.getByRole('heading', { name: 'Datos personales' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Autorización de datos' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /guardar datos/i })).toBeNull()
    expect(screen.queryByText(/dato pendiente/i)).toBeNull()
  })

  it('con menos de 16 años avisa y no deja autorizar', () => {
    render(<SeccionDatosPersonales {...props()} />)
    fireEvent.change(fecha(), { target: { value: anios(15) } })

    expect(screen.getByText(/menor de la edad permitida/i)).toBeTruthy()
    expect(autorizacion().disabled).toBe(true)
  })

  it('con 17 años pide al representante legal', () => {
    render(<SeccionDatosPersonales {...props()} />)
    expect(screen.queryByText('Representante legal')).toBeNull()

    fireEvent.change(fecha(), { target: { value: anios(17) } })

    expect(screen.getByText('Representante legal')).toBeTruthy()
    expect(autorizacion().disabled).toBe(false)
  })

  it('un mayor de edad no ve el bloque del representante', () => {
    render(<SeccionDatosPersonales {...props()} />)
    fireEvent.change(fecha(), { target: { value: anios(30) } })

    expect(screen.queryByText('Representante legal')).toBeNull()
  })

  it('marcar la autorización guarda los datos y relee la postulación', async () => {
    const p = props()
    guardarDatosPersonales.mockResolvedValue({})
    render(<SeccionDatosPersonales {...p} />)

    fireEvent.click(autorizacion())

    await waitFor(() => expect(guardarDatosPersonales).toHaveBeenCalledTimes(1))
    expect(guardarDatosPersonales.mock.calls[0][0]).toBe(7)
    expect(guardarDatosPersonales.mock.calls[0][1].acepta_tratamiento_datos).toBe(true)
    expect(p.onRecargar).toHaveBeenCalled()
  })

  it('si el servidor rechaza los datos, la casilla vuelve a quedar sin marcar', async () => {
    guardarDatosPersonales.mockRejectedValue({ response: { status: 422, data: { errors: { nombres: ['El campo nombres es obligatorio.'] } } } })
    render(<SeccionDatosPersonales {...props()} />)

    fireEvent.click(autorizacion())

    await waitFor(() => expect(screen.getByText('El campo nombres es obligatorio.')).toBeTruthy())
    expect(autorizacion().checked).toBe(false)
  })

  it('con datos ya guardados la autorización queda marcada y bloqueada', () => {
    render(<SeccionDatosPersonales {...props()} datos={{ nombres: 'Ana', acepta_tratamiento_datos: true }} />)

    expect(autorizacion().checked).toBe(true)
    expect(autorizacion().disabled).toBe(true)
    expect(screen.getByText(/datos autorizados y guardados/i)).toBeTruthy()
  })

  it('la flecha para continuar a documentos está bloqueada hasta autorizar', () => {
    const onContinuar = vi.fn()
    const { rerender } = render(<SeccionDatosPersonales {...props()} onContinuar={onContinuar} />)
    const continuar = () => screen.getByRole('button', { name: /continuar a documentos/i })

    expect(continuar().disabled).toBe(true)
    expect(screen.getByText(/autoriza el tratamiento de tus datos para continuar/i)).toBeTruthy()

    rerender(<SeccionDatosPersonales {...props()} datos={{ nombres: 'Ana' }} onContinuar={onContinuar} />)
    expect(continuar().disabled).toBe(false)
    fireEvent.click(continuar())
    expect(onContinuar).toHaveBeenCalledTimes(1)
  })

  it('sin pestañas (pantalla apilada) no ofrece la flecha', () => {
    render(<SeccionDatosPersonales {...props()} />)

    expect(screen.queryByRole('button', { name: /continuar a documentos/i })).toBeNull()
  })

  it('el municipio depende del departamento: se pide al elegirlo y se limpia al cambiarlo', async () => {
    render(<SeccionDatosPersonales {...props()} />)
    const departamento = screen.getByLabelText(/^departamento/i)
    const municipio = () => screen.getByLabelText(/^municipio/i)

    // Sin departamento, el municipio está bloqueado.
    expect(municipio().disabled).toBe(true)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Antioquia' })).toBeTruthy())

    fireEvent.change(departamento, { target: { value: '05' } })
    await waitFor(() => expect(screen.getByRole('option', { name: 'Medellín' })).toBeTruthy())
    expect(listaMunicipios).toHaveBeenCalledWith('05')
    expect(municipio().disabled).toBe(false)

    fireEvent.change(municipio(), { target: { value: '05001' } })
    expect(municipio().value).toBe('05001')

    // Otro departamento: el municipio anterior ya no vale y se limpia.
    fireEvent.change(departamento, { target: { value: '13' } })
    await waitFor(() => expect(screen.getByRole('option', { name: 'Cartagena de Indias' })).toBeTruthy())
    expect(municipio().value).toBe('')
  })

  it('no editable muestra el motivo y bloquea la autorización', () => {
    render(<SeccionDatosPersonales {...props()} editable={false} motivoBloqueo="Tu postulación ya fue enviada." />)

    expect(screen.getByText('Tu postulación ya fue enviada.')).toBeTruthy()
    expect(autorizacion().disabled).toBe(true)
  })
})
