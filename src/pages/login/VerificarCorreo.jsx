import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { segundosReintento } from '../../api/reintento'
import TarjetaAuth from '../../components/ui/TarjetaAuth'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_INPUT_CODIGO } from '../../lib/estilos'
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
      <h2 className="text-xl font-semibold text-sena-azul dark:text-sena-texto">
        Verifica tu correo
      </h2>

      <p className="mt-2 text-sm text-sena-azul/80 dark:text-sena-texto-suave">
        Enviamos un código de 6 dígitos a <strong>{user.email}</strong>. Válido
        durante {MINUTOS_VALIDEZ} minutos.
      </p>

      {errorGlobal && <MensajeError className="mt-4">{errorGlobal}</MensajeError>}

      <form onSubmit={confirmar} className="mt-4 flex flex-col gap-4">
        <Campo etiqueta="Código" error={errores.code}>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            className={CLASE_INPUT_CODIGO}
          />
        </Campo>

        <Boton type="submit" disabled={enviando || code.length !== 6}>
          {enviando ? 'Verificando...' : 'Confirmar correo'}
        </Boton>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={reenviar}
          disabled={reenviando || bloqueado}
          className="text-sena-oscuro hover:text-sena hover:underline disabled:cursor-not-allowed disabled:opacity-60 dark:text-sena-acento dark:hover:text-sena"
        >
          {reenviando
            ? 'Enviando...'
            : bloqueado
              ? `Reenviar código (${segundos} s)`
              : 'Reenviar código'}
        </button>

        <button
          type="button"
          onClick={logout}
          className="text-sena-azul/70 hover:text-sena hover:underline dark:text-sena-texto-suave dark:hover:text-sena"
        >
          Cerrar sesión
        </button>
      </div>
    </TarjetaAuth>
  )
}