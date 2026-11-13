import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { segundosReintento } from '../../api/reintento'
import PantallaCarga from '../../components/ui/PantallaCarga'
import TarjetaAuth from '../../components/ui/TarjetaAuth'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_CAMPO_CODIGO, CLASE_TEXTO_PARTIDO } from '../../lib/estilos'
import { borrarOtp, guardarOtp, leerOtp, MINUTOS_VALIDEZ } from '../../lib/otpSesion'
import { mostrarAvisoGlobal } from '../../lib/validacionAcceso'
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
    return <PantallaCarga operacion="sesion" />
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
      <h2 className="text-2xl font-bold text-sena-azul dark:text-sena-texto">
        Verifica tu correo
      </h2>

      <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
        Enviamos un código de 6 dígitos a{' '}
        <strong className={CLASE_TEXTO_PARTIDO}>{user.email}</strong>. Válido durante{' '}
        {MINUTOS_VALIDEZ} minutos.
      </p>

      {errorGlobal && mostrarAvisoGlobal(errores, ['code']) && <MensajeError className="mt-4">{errorGlobal}</MensajeError>}

      <form onSubmit={confirmar} noValidate className="mt-4 flex flex-col gap-4">
        <Campo etiqueta="Código" error={errores.code}>
          {({ id, describedby, invalid }) => (
            <input
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={CLASE_CAMPO_CODIGO}
            />
          )}
        </Campo>

        <Boton type="submit" tamano="flexible" disabled={enviando || code.length !== 6}>
          {enviando ? 'Verificando...' : 'Confirmar correo'}
        </Boton>
      </form>

      <div className="mt-4 flex flex-col items-stretch gap-1">
        <Boton variante="enlace" tamano="flexible" onClick={reenviar} disabled={reenviando || bloqueado}>
          {reenviando
            ? 'Enviando...'
            : bloqueado
              ? `Reenviar código (${segundos} s)`
              : 'Reenviar código'}
        </Boton>

        <Boton variante="enlace" tamano="flexible" onClick={logout}>
          Cerrar sesión
        </Boton>
      </div>
    </TarjetaAuth>
  )
}
