import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { mensajeError } from '../../api/mensajeError'
import GoogleIcon from '../../components/ui/GoogleIcon'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import { CLASE_INPUT } from '../../lib/estilos'

const GOOGLE_URL = import.meta.env.VITE_GOOGLE_URL ?? '/api/auth/google/redirect'

const MENSAJES_ERROR = {
  oauth: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
  sin_correo: 'Tu cuenta de Google no compartió un correo, así que no podemos crear tu acceso.',
  desactivado: 'Tu usuario está desactivado. Contacta al instructor.',
}

const MENSAJE_EXITO = {
  contrasena: 'Tu contraseña fue actualizada. Ahora puedes iniciar sesión.',
  registro: 'Tu cuenta fue creada correctamente. Inicia sesión para verificar tu correo.',
}

export default function Login() {
  const { login } = useAuth()
  const [busqueda] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [verClave, setVerClave] = useState(false)
  const validarFormulario = (formulario) => {
    const email = formulario.elements.namedItem('email')
    const password = formulario.elements.namedItem('password')

    email.setCustomValidity('')
    password.setCustomValidity('')

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.value.trim()) {
      email.setCustomValidity('Ingresa tu correo electrónico.')
    } else if (!emailValido.test(email.value.trim())) {
      email.setCustomValidity(
        'Ingresa un correo electrónico válido. Ejemplo: usuario@correo.com',
      )
    }

    if (!password.value) {
      password.setCustomValidity('Ingresa tu contraseña.')
    }

    const campos = [email, password]
    const campoInvalido = campos.find((campo) => !campo.checkValidity())

    if (campoInvalido) {
      campoInvalido.reportValidity()
      campoInvalido.focus()
      return false
    }

    return true
  }

  // Errores que devuelve el backend al callback de Google (?error=...)
  const errorOauth = busqueda.get('error')
  const exitoContrasena = busqueda.get('contrasena')
  const exitoRegistro = busqueda.get('registro')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validarFormulario(e.currentTarget)) {
      return
    }
    setEnviando(true)

    try {
      await login(email, password)
      // AuthLayout detecta la sesión y redirige según email_verified.
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const entrarConGoogle = () => {
    // Navegación completa (no fetch): el backend redirige a Google y vuelve.
    window.location.href = GOOGLE_URL
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      <h2 className="text-xl font-semibold text-sena-azul dark:text-sena-texto">
        Iniciar sesión
      </h2>

      {errorOauth && (
        <MensajeError>{MENSAJES_ERROR[errorOauth] ?? MENSAJES_ERROR.oauth}</MensajeError>
      )}

      {exitoContrasena && (
        <MensajeExito>
          {MENSAJE_EXITO[exitoContrasena] ?? 'Operación completada con éxito.'}
        </MensajeExito>
      )}

      {exitoRegistro && <MensajeExito>{MENSAJE_EXITO.registro}</MensajeExito>}

      {error && <MensajeError>{error}</MensajeError>}

      <Campo etiqueta="Correo">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          name="email"
          onInput={(e) => e.currentTarget.setCustomValidity('')}
          required
          autoComplete="email"
          className={CLASE_INPUT}
        />
      </Campo>

      <Campo etiqueta="Contraseña">
        <div className="relative">
          <input
            type={verClave ? 'text' : 'password'}
            value={password}
            name="password"
            onInput={(e) => e.currentTarget.setCustomValidity('')}
            onChange={(e) => {
              const value = e.target.value
              setPassword(value)

              if (!value) {
                setVerClave(false)
              }
            }}
            required
            autoComplete="current-password"
            className={`w-full pr-10 ${CLASE_INPUT}`}
          />

          {password.length > 0 && (
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-sena-azul/60 hover:text-sena-oscuro dark:text-sena-texto-suave dark:hover:text-sena"
            >
              {verClave ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </Campo>

      <div className="flex justify-end text-sm">
        <Link
          to="/recuperar"
          className="text-sena-oscuro hover:text-sena hover:underline dark:text-sena-acento dark:hover:text-sena"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Entrando...' : 'Entrar'}
      </Boton>

      <div className="flex items-center gap-3 text-xs text-sena-azul/60 dark:text-sena-texto-suave">
        <span className="h-px flex-1 bg-sena-azul/20 dark:bg-sena-borde" />
        o iniciar sesión con
        <span className="h-px flex-1 bg-sena-azul/20 dark:bg-sena-borde" />
      </div>

      <Boton
        variante="secundario"
        type="button"
        onClick={entrarConGoogle}
        className="w-full"
      >
        <GoogleIcon />
        Entrar con Google
      </Boton>

      <p className="text-center text-sm text-sena-azul/80 dark:text-sena-texto-suave">
        ¿No tienes cuenta?{' '}
        <Link
          to="/registro"
          className="font-medium text-sena-oscuro hover:text-sena hover:underline dark:text-sena-acento dark:hover:text-sena"
        >
          Crear cuenta de aspirante
        </Link>
      </p>
    </form>
  )
}