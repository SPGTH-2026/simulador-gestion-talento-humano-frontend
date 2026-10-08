import { segundosReintento } from './reintento'

export function mensajeError(error) {
  // Sin respuesta: el backend está apagado, o no hay red, o el navegador
  // bloqueó la petición. Nunca se confunde con "sesión perdida".
  if (!error.response) {
    return 'No pudimos conectarnos. Inténtalo de nuevo en un momento.'
  }

  const TRADUCCIONES_BACKEND = {
    'The email has already been taken.': 'Este correo ya se encuentra registrado.',
    'The email field is required.': 'El correo es obligatorio.',
    'The password field is required.': 'La contraseña es obligatoria.',
    'The password must be at least 8 characters.':
      'La contraseña debe tener mínimo 8 caracteres.',
    'The name field is required.': 'El nombre completo es obligatorio.',
    'The ficha codigo field is required.': 'El código de ficha es obligatorio.',
    'The password field must contain at least one letter.':
      'La contraseña debe contener al menos una letra.',

    'The password field must contain at least one number.':
      'La contraseña debe contener al menos un número.',
  }

  function traducirMensaje(mensaje) {
    return TRADUCCIONES_BACKEND[mensaje] ?? mensaje
  }

  const { status, data } = error.response

  if (status === 401) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  }

  // 419 = falta /sanctum/csrf-cookie o la cabecera X-XSRF-TOKEN.
  if (status === 419) {
    return 'La sesión expiró. Recarga la página e inténtalo de nuevo.'
  }

  if (status === 403) {
    return data?.message ?? 'No tienes permiso para hacer esto.'
  }

  if (status === 429) {
    const espera = segundosReintento(error)
    return espera
      ? `Demasiados intentos. Espera ${espera} s e inténtalo de nuevo.`
      : 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  }

  if (status >= 500) {
    return 'El servidor tuvo un error. Inténtalo de nuevo en un momento.'
  }

  // Laravel: { message, errors: { email: ['mensaje'], password: ['mensaje'] } }
  if (status === 422 && data?.errors) {
    const primerCampo = Object.values(data.errors)[0]
    return traducirMensaje(primerCampo?.[0]) ?? 'Los datos enviados no son válidos.'
  }

  return traducirMensaje(data?.message) ?? 'Ocurrió un error inesperado.'
}

// 422 por campo, para pintarlo en el input que corresponde.
// 'El código no es válido' -> { code: 'El código no es válido' }
export function erroresDeCampo(error) {
  const errores = error.response?.data?.errors
  if (!errores) return {}

  return Object.fromEntries(
    Object.entries(errores).map(([campo, mensajes]) => [
      campo,
      Array.isArray(mensajes) ? mensajes[0] : mensajes,
    ]),
  )
}