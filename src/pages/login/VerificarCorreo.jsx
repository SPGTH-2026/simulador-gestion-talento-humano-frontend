import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { segundosReintento } from '../../api/reintento'
import TarjetaAuth from '../../components/ui/TarjetaAuth'
import { borrarOtp, guardarOtp, leerOtp, MINUTOS_VALIDEZ } from '../../lib/otpSesion'
import { useCuentaAtras } from '../../lib/useCuentaAtras'

const PANTALLA = 'verificar-correo'

export default function VerificarCorreo() {
  const { user, authResolved, refrescar, logout } = useAuth()

  const [code, setCode] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const { segundos, iniciar, bloqueado } = useCuentaAtras()

  // Pedimos un código al entrar SOLO si no hay uno vigente en sessionStorage.
  // Cada envío invalida el anterior y hay límite de 3/min y 10/hora, así que un
  // F5 no puede gastar uno. El ref evita el doble envío de StrictMode.
  const yaPidio = useRef(false)

  useEffect(() => {
    if (!authResolved || !user || user.email_verified) return
    if (yaPidio.current) return
    if (leerOtp(PANTALLA)) return

    yaPidio.current = true
    authApi
      .sendVerification()
      .then(() => guardarOtp(PANTALLA))
      .catch((err) => {
        const espera = segundosReintento(err)
        if (espera) iniciar(espera)
        setErrorGlobal(mensajeError(err))
      })
  }, [authResolved, user, iniciar])

  if (!authResolved) {
    return <p className="p-6 text-center">Cargando...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Ya confirmado (o alguien lo confirmó en otra pestaña): fuera de aquí.
  if (user.email_verified) {
    return <Navigate to="/" replace />
  }

  const confirmar = async (e) => {
    e.preventDefault()
    setErrores({})
    setErrorGlobal('')
    setEnviando(true)

    try {
      await authApi.confirmVerification(code)
      // Traemos el usuario actualizado para que email_verified sea true y el
      // guard deje pasar. Sin esto ProtectedRoute nos devolvería a esta misma
      // página en un bucle.
      await refrescar()
      borrarOtp(PANTALLA)
      setCode('')
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
      await authApi.sendVerification()
      guardarOtp(PANTALLA)
      iniciar(0)
    } catch (err) {
      const espera = segundosReintento(err)
      if (espera) iniciar(espera)
      setErrorGlobal(mensajeError(err))
    } finally {
      setReenviando(false)
    }
  }

  return (
    <TarjetaAuth>
      <h2 className="text-xl font-semibold text-sena-azul">Verifica tu correo</h2>

      <p className="mt-2 text-sm text-sena-azul/80">
        Enviamos un código de 6 dígitos a <strong>{user.email}</strong>. Válido
        durante {MINUTOS_VALIDEZ} minutos.
      </p>

      {errorGlobal && (
        <p role="alert" className="mt-4 rounded bg-red-100 p-3 text-sm text-red-700">
          {errorGlobal}
        </p>
      )}

      <form onSubmit={confirmar} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul">
          Código
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            className="rounded border border-sena-azul/20 p-2 text-center text-2xl tracking-[0.5em] font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40"
          />
          {errores.code && <span className="text-xs text-red-600">{errores.code}</span>}
        </label>

        <button
          type="submit"
          disabled={enviando || code.length !== 6}
          className="rounded bg-sena-oscuro p-2 font-semibold text-white transition-colors hover:bg-sena-azul disabled:opacity-60"
        >
          {enviando ? 'Verificando...' : 'Confirmar correo'}
        </button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={reenviar}
          disabled={reenviando || bloqueado}
          className="text-sena-oscuro hover:text-sena hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {reenviando
            ? 'Enviando...'
            : bloqueado
              ? `Reenviar código (${segundos} s)`
              : 'Reenviar código'}
        </button>

        <button type="button" onClick={logout} className="text-sena-azul/70 hover:text-sena hover:underline">
          Cerrar sesión
        </button>
      </div>
    </TarjetaAuth>
  )
}