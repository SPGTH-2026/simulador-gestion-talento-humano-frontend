// Vigencia del código OTP en el backend (OtpService::TTL_MINUTES).
export const MINUTOS_VALIDEZ = 10

const PREFIJO = 'spgth:otp:'
const TTL_MS = MINUTOS_VALIDEZ * 60 * 1000

// El backend invalida el código anterior cada vez que se envía uno nuevo, y el
// envío está limitado a 3/min y 10/hora. Guardamos en sessionStorage qué
// pantalla tiene ya un código vigente para que un F5 no gaste uno.
//
// sessionStorage (y no localStorage) porque el registro debe morir al cerrar la
// pestaña: el código no debe sobrevivir más allá de la sesión de trabajo.
export function leerOtp(pantalla) {
  try {
    const crudo = sessionStorage.getItem(PREFIJO + pantalla)
    if (!crudo) return null

    const registro = JSON.parse(crudo)
    if (typeof registro?.sentAt !== 'number') return null

    if (Date.now() - registro.sentAt > TTL_MS) {
      sessionStorage.removeItem(PREFIJO + pantalla)
      return null
    }

    return registro
  } catch {
    // sessionStorage puede estar bloqueado (modo privado). El flujo sigue
    // funcionando, solo se pierde el ahorro de envíos.
    return null
  }
}

export function guardarOtp(pantalla, datos = {}) {
  try {
    sessionStorage.setItem(
      PREFIJO + pantalla,
      JSON.stringify({ ...datos, sentAt: Date.now() }),
    )
  } catch {
    // Mismo caso que arriba: no vale la pena romper la pantalla por esto.
  }
}

export function borrarOtp(pantalla) {
  sessionStorage.removeItem(PREFIJO + pantalla)
}

// No dejamos el correo completo a la vista en el paso 2.
export function enmascararEmail(email) {
  const [usuario, dominio] = String(email ?? '').split('@')
  if (!dominio) return email
  if (usuario.length <= 2) return `${usuario[0] ?? '*'}***@${dominio}`
  return `${usuario.slice(0, 2)}***@${dominio}`
}