import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

let usuario
const refrescar = vi.fn(async () => {})
vi.mock('../../auth/useAuth', () => ({ useAuth: () => ({ user: usuario, refrescar }) }))
vi.mock('../../api/auth', () => ({ solicitarCodigoContrasena: vi.fn(), establecerContrasena: vi.fn() }))

import { establecerContrasena, solicitarCodigoContrasena } from '../../api/auth'
import { MemoryRouter } from 'react-router-dom'
import DialogoContrasena from './DialogoContrasena'
import Seguridad from './Seguridad'

const pintar = () => render(<MemoryRouter><Seguridad /></MemoryRouter>)

// Sin dependencias nuevas: se escribe y se pulsa con fireEvent (no hay user-event en el proyecto).
const usuarioSimulado = () => ({
  click: async (el) => fireEvent.click(el),
  type: async (el, texto) => fireEvent.change(el, { target: { value: el.value + texto } }),
})

const cuenta = (contrasena, google = false) => ({ id: 1, email: 'persona@correo.test', acceso: { contrasena, google } })

beforeEach(() => {
  vi.clearAllMocks()
  usuario = cuenta('desconocido')
  solicitarCodigoContrasena.mockResolvedValue({ message: 'Te enviamos un código a tu correo.' })
  establecerContrasena.mockResolvedValue({ message: 'Tu contraseña quedó guardada. Cerramos tus otras sesiones.', acceso: { google: true, contrasena: 'definida' } })
})
afterEach(cleanup)

const abrirFormulario = async (u) => {
  await u.click(screen.getByRole('button', { name: /contraseña/i }))
  await u.click(screen.getByRole('button', { name: 'Enviar código' }))
  return screen.findByLabelText('Código de verificación')
}

describe('Seguridad de la cuenta', () => {
  it.each([
    ['sin_definir', 'Puedes establecer una contraseña como opción adicional de acceso.', 'Establecer contraseña'],
    ['definida', 'Te enviaremos un código al correo para confirmar el cambio.', 'Cambiar contraseña'],
    ['desconocido', 'Puedes establecer una contraseña nueva para acceder con tu correo.', 'Configurar contraseña'],
  ])('en estado «%s» el diálogo muestra su explicación y la acción «%s» directamente', (estado, explicacion, accion) => {
    usuario = cuenta(estado, true)
    pintar()
    const dialogo = screen.getByRole('dialog', { name: 'Contraseña' })
    expect(within(dialogo).getByText(new RegExp(explicacion.replace(/[.]/g, '\\.')))).toBeTruthy()
    expect(within(dialogo).getByRole('button', { name: accion })).toBeTruthy()
    expect(within(dialogo).getByText(/Podrás seguir accediendo con Google/)).toBeTruthy()
    // Sin etiquetas de estado ni tarjetas anidadas: solo cerrar y la acción.
    expect(within(dialogo).getAllByRole('button').map((b) => b.textContent || b.getAttribute('aria-label'))).toEqual(['Cerrar', accion])
    expect(screen.queryByText(/Sin información|Sin definir|Definida/)).toBeNull()
  })

  it('el estado desconocido no afirma que la cuenta no tenga contraseña', () => {
    pintar()
    expect(screen.queryByText(/sin contraseña|no tienes contraseña/i)).toBeNull()
  })

  it('cerrar con Escape, con la X o con el fondo no pide ni guarda nada', async () => {
    const alCerrar = vi.fn()
    render(<DialogoContrasena onCerrar={alCerrar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(alCerrar).toHaveBeenCalledTimes(2)
    expect(solicitarCodigoContrasena).not.toHaveBeenCalled()
    expect(establecerContrasena).not.toHaveBeenCalled()
  })

  it('con una petición en curso no se cierra ni con Escape', async () => {
    solicitarCodigoContrasena.mockImplementation(() => new Promise(() => {}))
    const alCerrar = vi.fn()
    render(<DialogoContrasena onCerrar={alCerrar} />)
    fireEvent.click(screen.getByRole('button', { name: /contraseña/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByRole('button', { name: 'Enviando…' })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(alCerrar).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cerrar' }).disabled).toBe(true)
  })

  it('devuelve el foco a quien abrió el diálogo al cerrarlo', async () => {
    const abrir = document.createElement('button')
    document.body.append(abrir)
    abrir.focus()
    const { unmount } = render(<DialogoContrasena onCerrar={() => {}} />)
    await waitFor(() => expect(document.activeElement).not.toBe(abrir))
    unmount()
    await waitFor(() => expect(document.activeElement).toBe(abrir))
    abrir.remove()
  })

  it('sin Google vinculado no promete seguir accediendo con Google', () => {
    usuario = cuenta('definida', false)
    pintar()
    expect(screen.queryByText(/Google/)).toBeNull()
  })

  it('no hay pantalla sin sesión de la cuenta: nunca pide ni muestra un destinatario editable', async () => {
    const u = usuarioSimulado()
    pintar()
    await u.click(screen.getByRole('button', { name: /contraseña/i }))
    // El correo solo se muestra enmascarado y no hay ningún campo de correo.
    expect(screen.queryByLabelText(/correo/i)).toBeNull()
    expect(screen.getByText(/p\*+@correo\.test|\*+/)).toBeTruthy()
  })

  it('pide el código al correo de la sesión, muestra el formulario y enfoca el código', async () => {
    const u = usuarioSimulado()
    pintar()
    const codigo = await abrirFormulario(u)

    expect(solicitarCodigoContrasena).toHaveBeenCalledWith()
    await waitFor(() => expect(document.activeElement).toBe(codigo))
    expect(screen.getByLabelText('Nueva contraseña')).toBeTruthy()
    expect(screen.getByLabelText('Repetir contraseña')).toBeTruthy()
  })

  it('guarda con código válido, muestra el aviso, refresca la sesión y no deja datos en pantalla', async () => {
    usuario = cuenta('sin_definir', true)
    const u = usuarioSimulado()
    pintar()
    await abrirFormulario(u)

    await u.type(screen.getByLabelText('Código de verificación'), '123456')
    await u.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave2026')
    await u.type(screen.getByLabelText('Repetir contraseña'), 'NuevaClave2026')
    await u.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(establecerContrasena).toHaveBeenCalledWith({ code: '123456', password: 'NuevaClave2026', password_confirmation: 'NuevaClave2026' })
    const aviso = await screen.findByText(/Tu contraseña quedó guardada/)
    expect(aviso.textContent).toMatch(/seguir entrando con Google/)
    await waitFor(() => expect(document.activeElement).toBe(aviso.closest('[tabindex="-1"]')))
    expect(refrescar).toHaveBeenCalledTimes(1)
    expect(screen.queryByLabelText('Nueva contraseña')).toBeNull()
  })

  it('valida en el cliente: código de 6 dígitos, regla de la contraseña y confirmación, sin llamar al servidor', async () => {
    const u = usuarioSimulado()
    pintar()
    await abrirFormulario(u)

    await u.type(screen.getByLabelText('Código de verificación'), '12')
    await u.type(screen.getByLabelText('Nueva contraseña'), 'corta')
    await u.type(screen.getByLabelText('Repetir contraseña'), 'otra')
    await u.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(await screen.findByText('Ingresa el código de 6 dígitos.')).toBeTruthy()
    // Aparece la ayuda y, ahora, el error del mismo texto.
    expect(screen.getAllByText('Mínimo 8 caracteres, con letras y números.').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy()
    expect(establecerContrasena).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByLabelText('Código de verificación'))
  })

  it('un código rechazado por el servidor se muestra junto al campo y se puede corregir', async () => {
    establecerContrasena.mockRejectedValueOnce({
      response: { status: 422, data: { message: 'El código no es válido o expiró', errors: { code: ['El código no es válido o expiró'] } }, headers: {} },
    })
    const u = usuarioSimulado()
    pintar()
    await abrirFormulario(u)
    await u.type(screen.getByLabelText('Código de verificación'), '111111')
    await u.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave2026')
    await u.type(screen.getByLabelText('Repetir contraseña'), 'NuevaClave2026')
    await u.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(await screen.findByText('El código no es válido o expiró')).toBeTruthy()
    expect(screen.getByLabelText('Código de verificación').getAttribute('aria-invalid')).toBe('true')
    // Sigue en el formulario con lo escrito, y el botón de guardar vuelve a estar disponible.
    expect(screen.getByRole('button', { name: 'Guardar contraseña' }).disabled).toBe(false)
  })

  it('previene el doble envío al guardar y al pedir el código', async () => {
    let terminar
    solicitarCodigoContrasena.mockImplementation(() => new Promise((r) => { terminar = () => r({ message: 'ok' }) }))
    const u = usuarioSimulado()
    pintar()
    await u.click(screen.getByRole('button', { name: /contraseña/i }))
    const enviar = screen.getByRole('button', { name: 'Enviar código' })
    fireEvent.click(enviar)
    fireEvent.click(enviar)
    fireEvent.click(enviar)
    expect(solicitarCodigoContrasena).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Enviando…' }).getAttribute('aria-busy')).toBe('true')
    terminar()
    await screen.findByLabelText('Código de verificación')
  })

  it('organiza las acciones: «Reenviar código» bajo el campo del código y al pie una sola acción principal (sin «Cancelar»: cerrar es la X)', async () => {
    const u = usuarioSimulado()
    pintar()
    await abrirFormulario(u)
    const formulario = screen.getByRole('form', { name: /contraseña/i })
    const orden = within(formulario).getAllByRole('button').map((b) => b.textContent)
    expect(orden).toEqual(['Reenviar código', 'Guardar contraseña'])
    expect(within(formulario).queryByRole('button', { name: 'Cancelar' })).toBeNull()
    // El reenvío va debajo del campo del código y antes de las contraseñas (explicación → código → reenviar → contraseñas).
    const reenviar = within(formulario).getByRole('button', { name: 'Reenviar código' })
    const campo = within(formulario).getByLabelText('Código de verificación')
    const clave = within(formulario).getByLabelText('Nueva contraseña')
    expect(campo.compareDocumentPosition(reenviar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(reenviar.compareDocumentPosition(clave) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('mientras se reenvía el código no se puede guardar ni cerrar con la X, y «Enviando…» dura toda la petición', async () => {
    const u = usuarioSimulado()
    pintar()
    await abrirFormulario(u)
    let terminar
    solicitarCodigoContrasena.mockImplementationOnce(() => new Promise((r) => { terminar = () => r({ message: 'ok' }) }))
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar código' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enviando…' }))
    expect(solicitarCodigoContrasena).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: 'Enviando…' }).getAttribute('aria-busy')).toBe('true')
    expect(screen.getByRole('button', { name: 'Cerrar' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Guardar contraseña' }).disabled).toBe(true)
    terminar()
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Enviando…' })).toBeNull())
  })

  it('el reenvío espera lo que indica el límite (429) y muestra la cuenta atrás', async () => {
    const u = usuarioSimulado()
    pintar()
    await abrirFormulario(u)
    solicitarCodigoContrasena.mockRejectedValueOnce({
      response: { status: 429, data: { message: 'Too Many Attempts.' }, headers: { 'retry-after': '42' } },
    })

    await u.click(screen.getByRole('button', { name: 'Reenviar código' }))

    const reenviar = await screen.findByRole('button', { name: /Reenviar código \(42 s\)/ })
    expect(reenviar.disabled).toBe(true)
  })

  it('cerrar con la X cierra el diálogo y al volver a abrirlo no queda nada de lo escrito', async () => {
    const u = usuarioSimulado()
    const alCerrar = vi.fn()
    const { unmount } = render(<DialogoContrasena onCerrar={alCerrar} />)
    await abrirFormulario(u)
    await u.type(screen.getByLabelText('Nueva contraseña'), 'NuevaClave2026')

    await u.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(alCerrar).toHaveBeenCalledTimes(1)
    unmount()

    render(<DialogoContrasena onCerrar={alCerrar} />)
    await abrirFormulario(u)
    expect(screen.getByLabelText('Nueva contraseña').value).toBe('')
  })

  it('es operable con teclado: la acción y los botones son controles nativos enfocables y el formulario se envía con Enter', async () => {
    const u = usuarioSimulado()
    pintar()
    const accion = screen.getByRole('button', { name: /contraseña/i })
    expect(accion.tagName).toBe('BUTTON')
    expect(accion.tabIndex).toBe(0)
    accion.focus()
    expect(document.activeElement).toBe(accion)
    await u.click(accion)
    expect(screen.getByRole('button', { name: 'Enviar código' }).tabIndex).toBe(0)
    await u.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByLabelText('Código de verificación')
    // Enter dentro de un campo envía el <form> (se valida y, si falta algo, enfoca el primer error).
    fireEvent.submit(screen.getByRole('form', { name: /contraseña/i }))
    expect(await screen.findByText('Ingresa el código de 6 dígitos.')).toBeTruthy()
  })
})
