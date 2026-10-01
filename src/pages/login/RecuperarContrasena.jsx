import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { segundosReintento } from '../../api/reintento'
import TarjetaAuth from '../../components/ui/TarjetaAuth'
import {
  borrarOtp,
  enmascararEmail,
  guardarOtp,
  leerOtp,
  MINUTOS_VALIDEZ,
} from '../../lib/otpSesion'
import { useCuentaAtras } from '../../lib/useCuentaAtras'

const PANTALLA = 'recuperar'

// El backend valida esto en Password::min(8)->letters()->numbers().
const REGLA_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

export default function RecuperarContrasena() {
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

  const pedirCodigo = async (correo) => {
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
    }
  }

  const reenviar = async () => {
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
    }
  }

  const restablecer = async (e) => {
    e.preventDefault()
    setErrores({})
    setErrorGlobal('')

    const codigoLimpio = codigo.replace(/\D/g, '').slice(0, 6)

    if (!REGLA_PASSWORD.test(password)) {
      setErrores({ password: 'Mínimo 8 caracteres, con letras y números.' })
      return
    }
    if (password !== confirmacion) {
      setErrores({ password: 'Las contraseñas no coinciden.' })
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

  return (
    <TarjetaAuth>
      <h2 className="text-xl font-semibold">Restablecer contraseña</h2>

      {errorGlobal && (
        <p role="alert" className="mt-3 rounded bg-red-100 p-3 text-sm text-red-700">
          {errorGlobal}
        </p>
      )}

      {paso === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            pedirCodigo(email)
          }}
          className="mt-4 flex flex-col gap-4"
        >
          <p className="text-sm text-slate-600">
            Escribe tu correo y te enviamos un código de 6 dígitos.
          </p>

          <label className="flex flex-col gap-1 text-sm">
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded border border-slate-300 p-2"
            />
            {errores.email && <span className="text-xs text-red-600">{errores.email}</span>}
          </label>

          <button
            type="submit"
            disabled={enviando || bloqueado}
            className="rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {enviando
              ? 'Enviando...'
              : bloqueado
                ? `Espera ${segundos} s`
                : 'Enviar código'}
          </button>

          <p className="text-center text-sm">
            <Link to="/login" className="text-blue-600 hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </form>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600">
            Enviamos un código a <strong>{enmascararEmail(email)}</strong>. Válido
            durante {MINUTOS_VALIDEZ} minutos.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            En desarrollo el código queda en{' '}
            <code>storage/logs/laravel.log</code> del backend.
          </p>

          <form onSubmit={restablecer} className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Código
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="rounded border border-slate-300 p-2 text-center text-2xl tracking-[0.5em]"
              />
              {errores.code && <span className="text-xs text-red-600">{errores.code}</span>}
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Nueva contraseña
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded border border-slate-300 p-2"
              />
              {errores.password && (
                <span className="text-xs text-red-600">{errores.password}</span>
              )}
              <span className="text-xs text-slate-500">
                Mínimo 8 caracteres, con letras y números.
              </span>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Repetir contraseña
              <input
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="rounded border border-slate-300 p-2"
              />
            </label>

            <button
              type="submit"
              disabled={enviando || bloqueado}
              className="rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {enviando ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>

          <div className="mt-4 flex flex-col items-center gap-2 text-sm">
            <button
              type="button"
              onClick={reenviar}
              disabled={reenviando || bloqueado}
              className="text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reenviando
                ? 'Enviando...'
                : bloqueado
                  ? `Reenviar código (${segundos} s)`
                  : 'Reenviar código'}
            </button>

            <button
              type="button"
              onClick={volverAlPaso1}
              className="text-slate-600 hover:underline"
            >
              Cambiar correo
            </button>
          </div>
        </>
      )}
    </TarjetaAuth>
  )
}