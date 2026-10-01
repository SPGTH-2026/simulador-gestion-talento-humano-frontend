import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { mensajeError } from '../../api/mensajeError'

const GOOGLE_URL = import.meta.env.VITE_GOOGLE_URL ?? 'http://localhost:8000/api/auth/google/redirect'

const MENSAJES_ERROR = {
  oauth: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
  sin_correo: 'Tu cuenta de Google no compartió un correo, así que no podemos crear tu acceso.',
  correo_en_uso: 'Ese correo ya está registrado con contraseña. Entra con tu correo y contraseña.',
  desactivado: 'Tu usuario está desactivado. Contacta al instructor.',
}

const MENSAJE_EXITO = {
  contrasena: 'Tu contraseña fue actualizada. Ahora puedes iniciar sesión.',
}

export default function Login() {
  const { login } = useAuth()
  const [busqueda] = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Errores que devuelve el backend al callback de Google (?error=...)
  const errorOauth = busqueda.get('error')
  const exitoContrasena = busqueda.get('contrasena')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-sena-azul">Iniciar sesión</h2>

      {(errorOauth || exitoContrasena) && (
        <>
          {errorOauth && (
            <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
              {MENSAJES_ERROR[errorOauth] ?? MENSAJES_ERROR.oauth}
            </p>
          )}
          {exitoContrasena && (
            <p
              role="status"
              className="rounded border border-sena/40 bg-sena/10 p-3 text-sm text-sena-oscuro"
            >
              {MENSAJE_EXITO[exitoContrasena] ?? 'Operación completada con éxito.'}
            </p>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul">
        Correo
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul">
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40"
        />
      </label>

      <div className="flex justify-end text-sm">
        <Link to="/recuperar" className="text-sena-oscuro hover:text-sena hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="rounded bg-sena-oscuro p-2 font-semibold text-white transition-colors hover:bg-sena-azul disabled:opacity-60"
      >
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>

      <button
        type="button"
        onClick={entrarConGoogle}
        className="rounded border border-sena-azul/25 p-2 font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30"
      >
        Entrar con Google
      </button>

      <p className="text-center text-sm text-sena-azul/80">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="font-medium text-sena-oscuro hover:text-sena hover:underline">
          Crear cuenta de aspirante
        </Link>
      </p>
    </form>
  )
}