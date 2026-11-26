import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

afterEach(cleanup)

vi.mock('../../api/convocatorias', () => ({
  listaParametros: vi.fn(async (tema) => ({
    data: tema === 'tipo_documento_identidad'
      ? [{ id: 1, codigo: 'cc', nombre: 'Cédula de ciudadanía' }]
      : [{ id: 2, codigo: 'tecnologo', nombre: 'Tecnólogo' }],
  })),
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

// Estable entre renders: el guardado automático depende de ellos.
const asegurar = vi.fn().mockResolvedValue({ postulacionId: 7 })
const onRecargar = vi.fn().mockResolvedValue(undefined)
const onError = vi.fn()

const props = () => ({ datos: null, editable: true, asegurar, onRecargar, onError })

const escribir = (etiqueta, valor) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
const fecha = () => screen.getByLabelText(/fecha de nacimiento/i)
const autorizacion = () => screen.getByRole('checkbox', { name: /autorizo el tratamiento/i })

// Llena el formulario completo de un mayor de edad (el último campo es el que lo deja completo).
async function llenarTodo({ sinMunicipio = false } = {}) {
  await waitFor(() => expect(screen.getByRole('option', { name: 'Antioquia' })).toBeTruthy())
  await waitFor(() => expect(screen.getByRole('option', { name: 'Cédula de ciudadanía' })).toBeTruthy())
  escribir(/^nombres/i, 'Camilo')
  escribir(/^apellidos/i, 'Rojas')
  escribir(/^tipo de documento/i, 'cc')
  escribir(/^número de documento/i, '1012345678')
  escribir(/fecha de nacimiento/i, anios(25))
  escribir(/^nivel de formación/i, 'tecnologo')
  escribir(/^teléfono/i, '3001234567')
  fireEvent.click(screen.getByRole('radio', { name: 'Masculino' }))
  escribir(/^departamento/i, '05')
  await waitFor(() => expect(screen.getByRole('option', { name: 'Medellín' })).toBeTruthy())
  if (!sinMunicipio) escribir(/^municipio/i, '05001')
}

beforeEach(() => {
  vi.clearAllMocks()
  asegurar.mockResolvedValue({ postulacionId: 7 })
  onRecargar.mockResolvedValue(undefined)
})

describe('SeccionDatosPersonales', () => {
  it('lleva la autorización dentro de datos personales y ningún botón de guardar', () => {
    render(<SeccionDatosPersonales {...props()} />)

    expect(screen.getByRole('heading', { name: 'Datos personales' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Autorización de datos' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /guardar datos/i })).toBeNull()
    expect(screen.queryByText(/dato pendiente/i)).toBeNull()
  })

  it('sin páginas informativas activas la casilla no enlaza a nada', () => {
    vi.stubEnv('VITE_PAGINAS_INFORMATIVAS', 'false')
    render(<SeccionDatosPersonales {...props()} />)

    expect(screen.queryByRole('link', { name: /política de privacidad/i })).toBeNull()
    expect(autorizacion()).toBeTruthy()
    vi.unstubAllEnvs()
  })

  it('con las páginas informativas activas enlaza a Privacidad en una pestaña nueva', () => {
    vi.stubEnv('VITE_PAGINAS_INFORMATIVAS', 'true')
    render(<SeccionDatosPersonales {...props()} />)

    const enlace = screen.getByRole('link', { name: /política de privacidad y datos personales/i })
    expect(enlace.getAttribute('href')).toBe('/privacidad')
    expect(enlace.getAttribute('target')).toBe('_blank')
    expect(enlace.getAttribute('rel')).toContain('noopener')
    expect(autorizacion()).toBeTruthy()
    vi.unstubAllEnvs()
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

  it('el bloque del representante pide los datos de contacto y avisa que la autorización se firma en persona', () => {
    render(<SeccionDatosPersonales {...props()} />)
    fireEvent.change(fecha(), { target: { value: anios(17) } })

    expect(screen.getByLabelText(/^correo electrónico/i)).toBeTruthy()
    // Solo la declaración, sin letra pequeña de ayuda debajo.
    expect(screen.queryByText(/se firma en persona/i)).toBeNull()
    expect(screen.getByRole('checkbox', { name: /declaro que mi representante legal conoce mi postulación/i })).toBeTruthy()
    // La declaración no menciona la asistencia a la firma: eso se resuelve en persona.
    expect(screen.queryByText(/asistirá/i)).toBeNull()
    // Opcionales: se identifican como tales.
    expect(screen.getByLabelText(/teléfono alterno \(opcional\)/i)).toBeTruthy()
    expect(screen.getByLabelText(/departamento de residencia \(opcional\)/i)).toBeTruthy()
  })

  it('un mayor de edad no ve el bloque del representante', () => {
    render(<SeccionDatosPersonales {...props()} />)
    fireEvent.change(fecha(), { target: { value: anios(30) } })

    expect(screen.queryByText('Representante legal')).toBeNull()
  })

  it('se guarda solo, sin botón, en cuanto el formulario está completo', async () => {
    guardarDatosPersonales.mockResolvedValue({})
    render(<SeccionDatosPersonales {...props()} />)

    await llenarTodo()

    await waitFor(() => expect(guardarDatosPersonales).toHaveBeenCalledTimes(1), { timeout: 3000 })
    const [postulacionId, cuerpo] = guardarDatosPersonales.mock.calls[0]
    expect(postulacionId).toBe(7)
    expect(cuerpo).toMatchObject({ sexo: 'hombre', departamento: '05', municipio: '05001', tipo_documento_identidad: 'cc', acepta_tratamiento_datos: false })
    expect(asegurar).toHaveBeenCalled()
    expect(onRecargar).toHaveBeenCalled()
  })

  it('con el formulario a medias no guarda nada', async () => {
    render(<SeccionDatosPersonales {...props()} />)

    await llenarTodo({ sinMunicipio: true })
    await new Promise((r) => setTimeout(r, 900))

    expect(guardarDatosPersonales).not.toHaveBeenCalled()
  })

  it('marcar la autorización también se guarda solo, junto con los datos', async () => {
    guardarDatosPersonales.mockResolvedValue({})
    render(<SeccionDatosPersonales {...props()} />)

    await llenarTodo()
    fireEvent.click(autorizacion())

    await waitFor(() => expect(guardarDatosPersonales.mock.calls.at(-1)?.[1]?.acepta_tratamiento_datos).toBe(true), { timeout: 3000 })
  })

  it('si el servidor rechaza los datos, muestra el error en el campo y no reintenta solo', async () => {
    guardarDatosPersonales.mockRejectedValue({ response: { status: 422, data: { errors: { nombres: ['El campo nombres es obligatorio.'] } } } })
    render(<SeccionDatosPersonales {...props()} />)

    await llenarTodo()

    await waitFor(() => expect(screen.getByText('El campo nombres es obligatorio.')).toBeTruthy(), { timeout: 3000 })
    await new Promise((r) => setTimeout(r, 900))
    expect(guardarDatosPersonales).toHaveBeenCalledTimes(1)
  })

  it('con la autorización ya registrada queda marcada y bloqueada', () => {
    render(<SeccionDatosPersonales {...props()} datos={{ nombres: 'Ana', acepta_tratamiento_datos: true }} />)

    expect(autorizacion().checked).toBe(true)
    expect(autorizacion().disabled).toBe(true)
    expect(screen.getByText('Autorizado')).toBeTruthy()
  })

  it('con datos guardados pero sin autorizar, la casilla sigue disponible', () => {
    render(<SeccionDatosPersonales {...props()} datos={{ nombres: 'Ana', acepta_tratamiento_datos: false }} />)

    expect(autorizacion().checked).toBe(false)
    expect(autorizacion().disabled).toBe(false)
  })

  it('el municipio depende del departamento: se pide al elegirlo y se limpia al cambiarlo', async () => {
    render(<SeccionDatosPersonales {...props()} />)
    const municipio = () => screen.getByLabelText(/^municipio/i)

    // Sin departamento, el municipio está bloqueado.
    expect(municipio().disabled).toBe(true)
    await waitFor(() => expect(screen.getByRole('option', { name: 'Antioquia' })).toBeTruthy())

    escribir(/^departamento/i, '05')
    await waitFor(() => expect(screen.getByRole('option', { name: 'Medellín' })).toBeTruthy())
    expect(listaMunicipios).toHaveBeenCalledWith('05')
    expect(municipio().disabled).toBe(false)

    fireEvent.change(municipio(), { target: { value: '05001' } })
    expect(municipio().value).toBe('05001')

    // Otro departamento: el municipio anterior ya no vale y se limpia.
    escribir(/^departamento/i, '13')
    await waitFor(() => expect(screen.getByRole('option', { name: 'Cartagena de Indias' })).toBeTruthy())
    expect(municipio().value).toBe('')
  })

  it('la flecha para continuar a documentos está bloqueada hasta que la autorización quede registrada', () => {
    const onContinuar = vi.fn()
    const { rerender } = render(<SeccionDatosPersonales {...props()} onContinuar={onContinuar} />)
    const continuar = () => screen.getByRole('button', { name: /continuar a documentos/i })

    expect(continuar().disabled).toBe(true)
    expect(screen.getByText(/completa tus datos y marca la autorización para continuar/i)).toBeTruthy()

    rerender(<SeccionDatosPersonales {...props()} datos={{ nombres: 'Ana', acepta_tratamiento_datos: true }} onContinuar={onContinuar} />)
    expect(continuar().disabled).toBe(false)
    fireEvent.click(continuar())
    expect(onContinuar).toHaveBeenCalledTimes(1)
  })

  it('sin pestañas (pantalla apilada) no ofrece la flecha', () => {
    render(<SeccionDatosPersonales {...props()} />)

    expect(screen.queryByRole('button', { name: /continuar a documentos/i })).toBeNull()
  })

  it('no editable muestra el motivo y bloquea la autorización', () => {
    render(<SeccionDatosPersonales {...props()} editable={false} motivoBloqueo="Tu postulación ya fue enviada." />)

    expect(screen.getByText('Tu postulación ya fue enviada.')).toBeTruthy()
    expect(autorizacion().disabled).toBe(true)
  })
})
