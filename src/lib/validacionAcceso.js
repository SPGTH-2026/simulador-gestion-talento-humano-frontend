// Validaciones de las pantallas de acceso. Cada función devuelve el mensaje de
// error o una cadena vacía. Conservan las reglas y los textos que antes daba la
// validación nativa del navegador (y las del backend: Password::min(8)
// ->letters()->numbers()).

const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarCorreo(valor) {
  const correo = valor.trim()
  if (!correo) return 'Ingresa tu correo electrónico.'
  if (!FORMATO_CORREO.test(correo)) {
    return 'Ingresa un correo electrónico válido. Ejemplo: usuario@correo.com'
  }
  return ''
}

export function validarNombre(valor) {
  return valor.trim() ? '' : 'Ingresa tu nombre completo.'
}

// Contraseña que ya existe (inicio de sesión): solo se exige que no esté vacía.
export function validarClaveActual(valor) {
  return valor ? '' : 'Ingresa tu contraseña.'
}

// Contraseña nueva (registro y restablecer).
export function validarClaveNueva(valor) {
  if (!valor) return 'Ingresa una contraseña.'
  if (valor.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.'
  if (!/[A-Za-z]/.test(valor)) return 'La contraseña debe contener al menos una letra.'
  if (!/[0-9]/.test(valor)) return 'La contraseña debe contener al menos un número.'
  return ''
}

export function validarFicha(valor) {
  return valor.trim() ? '' : 'Ingresa el código de ficha.'
}

export function validarCodigo(valor) {
  return /^\d{6}$/.test(valor) ? '' : 'Ingresa el código de 6 dígitos.'
}

// De un objeto { campo: mensaje } deja solo los campos con error.
export function soloConError(errores) {
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje))
}

// Lleva el foco al primer campo con error, en el orden en que aparecen en la
// pantalla. Los campos se buscan por su atributo name.
export function enfocarPrimerError(formulario, errores, orden) {
  const nombre = orden.find((campo) => errores[campo])
  formulario?.elements.namedItem(nombre)?.focus()
}

// El error del backend llega como mensaje global y, a la vez, por campo. Si ya
// se muestra junto a un campo visible, el aviso global sobra y solo repetiría
// el texto; si no, se conserva para que ningún error del backend se pierda.
export function mostrarAvisoGlobal(errores, camposVisibles) {
  return !camposVisibles.some((campo) => errores[campo])
}
