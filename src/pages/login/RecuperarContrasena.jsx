import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { segundosReintento } from '../../api/reintento'
import {
  borrarOtp,
  enmascararEmail,
  guardarOtp,
  leerOtp,
  MINUTOS_VALIDEZ,
} from '../../lib/otpSesion'
import { useCuentaAtras } from '../../lib/useCuentaAtras'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import CampoClave from '../../components/ui/CampoClave'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_CAMPO, CLASE_CAMPO_CODIGO } from '../../lib/estilos'
import {
  enfocarPrimerError,
  mostrarAvisoGlobal,
  soloConError,
  validarCodigo,
  validarCorreo,
} from '../../lib/validacionAcceso'

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

  return (
    <>
      <h2 className="text-2xl font-bold text-sena-azul dark:text-sena-texto">
        Restablecer contraseña
      </h2>

      {errorGlobal && mostrarAvisoGlobal(
          errores,
          paso === 1 ? ['email'] : ['code', 'password', 'confirmacion'],
        ) && <MensajeError className="mt-4">{errorGlobal}</MensajeError>}

      {paso === 1 ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            pedirCodigo(email, e.currentTarget)
          }}
          className="mt-4 flex flex-col gap-4"
        >
          <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
            Escribe tu correo y te enviamos un código de 6 dígitos.
          </p>

          <Campo etiqueta="Correo" error={errores.email}>
            {({ id, describedby, invalid }) => (
              <input
                id={id}
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              required
            aria-describedby={describedby}
                aria-invalid={invalid || undefined}
                className={CLASE_CAMPO}
              />
            )}
          </Campo>

          <Boton type="submit" tamano="flexible" disabled={enviando || bloqueado}>
            {enviando
              ? 'Enviando...'
              : bloqueado
                ? `Espera ${segundos} s`
                : 'Enviar código'}
          </Boton>

          <Boton as={Link} to="/login" variante="enlace" tamano="flexible">
            Volver a iniciar sesión
          </Boton>
        </form>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
            Enviamos un código a <strong>{enmascararEmail(email)}</strong>. Válido
            durante {MINUTOS_VALIDEZ} minutos.
          </p>

          <form noValidate onSubmit={restablecer} className="mt-4 flex flex-col gap-4">
            <Campo etiqueta="Código" error={errores.code}>
              {({ id, describedby, invalid }) => (
                <input
                  id={id}
                  type="text"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            aria-describedby={describedby}
                  aria-invalid={invalid || undefined}
                  className={CLASE_CAMPO_CODIGO}
                />
              )}
            </Campo>

            <CampoClave
              etiqueta="Nueva contraseña"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres, con letras y números."
              error={errores.password}
        required
            />

            <CampoClave
              etiqueta="Repetir contraseña"
              name="confirmacion"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              autoComplete="new-password"
              error={errores.confirmacion}
        required
            />

            <Boton type="submit" tamano="flexible" disabled={enviando || bloqueado}>
              {enviando ? 'Guardando...' : 'Restablecer contraseña'}
            </Boton>
          </form>

          <div className="mt-4 flex flex-col items-stretch gap-1">
            <Boton
              variante="enlace"
              tamano="flexible"
              onClick={reenviar}
              disabled={reenviando || bloqueado}
            >
              {reenviando
                ? 'Enviando...'
                : bloqueado
                  ? `Reenviar código (${segundos} s)`
                  : 'Reenviar código'}
            </Boton>

            <Boton variante="enlace" tamano="flexible" onClick={volverAlPaso1}>
              Cambiar correo
            </Boton>
          </div>
        </>
      )}
    </>
  )
}
