import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { mensajeError } from '../../api/mensajeError'
import GoogleIcon from '../../components/ui/GoogleIcon'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import CampoClave from '../../components/ui/CampoClave'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import { CLASE_CAMPO } from '../../lib/estilos'
import {
  enfocarPrimerError,
  soloConError,
  validarClaveActual,
  validarCorreo,
} from '../../lib/validacionAcceso'

const GOOGLE_URL = import.meta.env.VITE_GOOGLE_URL ?? '/api/auth/google/redirect'

const MENSAJES_ERROR = {
  oauth: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
  oauth_codigo:
    'La autenticación de Google se caducó o ya se usó. Vuelve a pulsar "Iniciar sesión con Google".',
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
  const [entrandoConGoogle, setEntrandoConGoogle] = useState(false)
  const [errores, setErrores] = useState({})

  // Errores que devuelve el backend al callback de Google (?error=...)
  const errorOauth = busqueda.get('error')
  const exitoContrasena = busqueda.get('contrasena')
  const exitoRegistro = busqueda.get('registro')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const formulario = e.currentTarget
    const encontrados = soloConError({
      email: validarCorreo(email),
      password: validarClaveActual(password),
    })
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) {
      enfocarPrimerError(formulario, encontrados, ['email', 'password'])
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
    // Se bloquea el botón para que un doble clic no genere dos códigos: el
    // segundo callback llega con un código ya gastado (invalid_grant).
    if (entrandoConGoogle) {
      return
    }
    setEntrandoConGoogle(true)
    window.location.href = GOOGLE_URL
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-sena-azul dark:text-sena-texto">Iniciar sesión</h2>

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

      <CampoClave
        etiqueta="Contraseña"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        error={errores.password}
        required
      />

      <Boton
        as={Link}
        to="/recuperar"
        variante="enlace"
        tamano="flexible"
        className="-mr-3 -mt-3 self-end"
      >
        ¿Olvidaste tu contraseña?
      </Boton>

      <Boton type="submit" tamano="flexible" disabled={enviando} className="w-full">
        {enviando ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </Boton>

      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-sena-texto-suave">
        <span className="h-px flex-1 bg-sena-separador" />
        o
        <span className="h-px flex-1 bg-sena-separador" />
      </div>

      <Boton
        variante="contorno"
        tamano="flexible"
        type="button"
        onClick={entrarConGoogle}
        disabled={entrandoConGoogle}
        className="w-full"
      >
        <GoogleIcon />
        {entrandoConGoogle ? 'Redirigiendo a Google...' : 'Iniciar sesión con Google'}
      </Boton>

      <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-sm text-slate-600 dark:text-sena-texto-suave">
        ¿No tienes cuenta?
        <Link
          to="/registro"
          className="inline-flex min-h-11 items-center font-semibold text-sena-oscuro underline-offset-4 hover:underline dark:text-sena-acento"
        >
          Crear cuenta de aspirante
        </Link>
      </p>
    </form>
  )
}
