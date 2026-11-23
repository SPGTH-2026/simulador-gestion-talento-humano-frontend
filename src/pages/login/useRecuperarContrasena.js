import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { segundosReintento } from '../../api/reintento'
import { borrarOtp, guardarOtp, leerOtp } from '../../lib/otpSesion'
import { useCuentaAtras } from '../../lib/useCuentaAtras'
import { enfocarPrimerError, soloConError, validarCodigo, validarCorreo } from '../../lib/validacionAcceso'

export const PANTALLA = 'recuperar'

export const REGLA_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

// Lógica de RecuperarContrasena: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useRecuperarContrasena() {
  const navegar = useNavigate()

  // Un F5 en el paso 2 no debe obligar a pedir otro código: si hay un email con
  // un OTP aún vigente, volvemos directamente a ese paso. El valor se calcula
  // en el render en lugar de en un efecto con setState (vería un parpadeo del
  // paso 1 antes de saltar al 2).
  const previo = leerOtp(PANTALLA)
  const [paso, setPaso] = useState(previo?.email ? 2 : 1)
  const [email, setEmail] = useState(previo?.email ?? '')
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')

  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const { segundos, iniciar, bloqueado } = useCuentaAtras()

  // El backend invalida el código anterior en cada envío, así que una segunda
  // petición en ráfaga dejaría sin validez el correo recién recibido. El estado
  // `enviando` se aplica recién en el siguiente render y un doble evento en el
  // mismo lote se cuela: el ref corta en seco, sin esperar a React.
  const enVuelo = useRef(false)

  const pedirCodigo = async (correo, formulario) => {
    if (enVuelo.current) return
    const falta = validarCorreo(correo)
    if (falta) {
      setErrores({ email: falta })
      formulario.elements.namedItem('email')?.focus()
      return
    }
    enVuelo.current = true

    setErrores({})
    setErrorGlobal('')
    setEnviando(true)

    try {
      await authApi.forgotPassword(correo)
      // El backend responde IGUAL exista o no el correo (anti-enumeración), así
      // que avanzamos siempre al paso 2 sin comprobar nada.
      guardarOtp(PANTALLA, { email: correo })
      setEmail(correo)
      setPaso(2)
    } catch (err) {
      setErrores(erroresDeCampo(err))
      setErrorGlobal(mensajeError(err))
      const espera = segundosReintento(err)
      if (espera) iniciar(espera)
    } finally {
      setEnviando(false)
      enVuelo.current = false
    }
  }

  const reenviar = async () => {
    if (enVuelo.current) return
    enVuelo.current = true

    setErrores({})
    setErrorGlobal('')
    setReenviando(true)

    try {
      // Reenviar es volver a pedir el código: mismo endpoint, mismo límite.
      await authApi.forgotPassword(email)
      guardarOtp(PANTALLA, { email })
      iniciar(0)
    } catch (err) {
      setErrores(erroresDeCampo(err))
      setErrorGlobal(mensajeError(err))
      const espera = segundosReintento(err)
      if (espera) iniciar(espera)
    } finally {
      setReenviando(false)
      enVuelo.current = false
    }
  }

  const restablecer = async (e) => {
    e.preventDefault()
    setErrores({})
    setErrorGlobal('')

    const codigoLimpio = codigo.replace(/\D/g, '').slice(0, 6)

    const encontrados = soloConError({
      code: validarCodigo(codigoLimpio),
      // Misma regla que el backend: Password::min(8)->letters()->numbers().
      password: REGLA_PASSWORD.test(password) ? '' : 'Mínimo 8 caracteres, con letras y números.',
      confirmacion: !confirmacion
        ? 'Repite la contraseña.'
        : password !== confirmacion
          ? 'Las contraseñas no coinciden.'
          : '',
    })
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados)
      enfocarPrimerError(e.currentTarget, encontrados, ['code', 'password', 'confirmacion'])
      return
    }

    setEnviando(true)

    try {
      await authApi.resetPassword({
        email,
        code: codigoLimpio,
        password,
        password_confirmation: confirmacion,
      })

      // El backend cierra TODAS las sesiones y tokens del usuario al
      // restablecer la contraseña, así que siempre se vuelve a /login.
      borrarOtp(PANTALLA)
      setPassword('')
      setConfirmacion('')
      setCodigo('')
      navegar('/login?contrasena=restablecida', { replace: true })
    } catch (err) {
      setErrores(erroresDeCampo(err))
      setErrorGlobal(mensajeError(err))
      const espera = segundosReintento(err)
      if (espera) iniciar(espera)
    } finally {
      setEnviando(false)
    }
  }

  const volverAlPaso1 = () => {
    borrarOtp(PANTALLA)
    setPaso(1)
    setCodigo('')
    setErrores({})
    setErrorGlobal('')
    iniciar(0)
  }

    return {
      bloqueado,
      codigo,
      confirmacion,
      email,
      enVuelo,
      enviando,
      errorGlobal,
      errores,
      iniciar,
      navegar,
      paso,
      password,
      pedirCodigo,
      previo,
      reenviando,
      reenviar,
      restablecer,
      segundos,
      setCodigo,
      setConfirmacion,
      setEmail,
      setEnviando,
      setErrorGlobal,
      setErrores,
      setPaso,
      setPassword,
      setReenviando,
      volverAlPaso1,
    }
}
