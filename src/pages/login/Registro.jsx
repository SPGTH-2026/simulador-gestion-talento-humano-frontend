import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { mensajeError } from '../../api/mensajeError'

const GOOGLE_URL = import.meta.env.VITE_GOOGLE_URL ?? 'http://localhost:8000/api/auth/google/redirect'

export default function Registro() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', ficha_codigo: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [verClave, setVerClave] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      // El registro abre sesión, así que AuthLayout detecta al usuario (correo
      // aún sin confirmar) y lo manda a /verificar-correo donde se envía el OTP.
      await register(form)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const registrarseConGoogle = () => {
    // Navegación completa (no fetch): el backend redirige a Google y vuelve.
    window.location.href = GOOGLE_URL
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-sena-azul dark:text-sena-texto">
        Crear cuenta de aspirante
      </h2>

      {error && (
        <p
          role="alert"
          className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={registrarseConGoogle}
        className="rounded border border-sena-azul/25 p-2 font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
      >
        Registrarse con Google
      </button>

      <div className="flex items-center gap-3 text-xs text-sena-azul/60 dark:text-sena-texto-suave">
        <span className="h-px flex-1 bg-sena-azul/20 dark:bg-sena-borde" />
        o con correo y contraseña
        <span className="h-px flex-1 bg-sena-azul/20 dark:bg-sena-borde" />
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto">
        Nombre completo
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          autoComplete="name"
          className="rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto">
        Correo
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
          className="rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto">
        Contraseña
        <div className="relative">
          <input
            type={verClave ? 'text' : 'password'}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border border-sena-azul/20 p-2 pr-10 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-sena-azul/60 hover:text-sena-oscuro dark:text-sena-texto-suave dark:hover:text-sena"
          >
            {verClave ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
        <span className="text-xs font-normal text-sena-azul/70 dark:text-sena-texto-suave">
          Mínimo 8 caracteres, con letras y números.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto">
        Código de ficha
        <input
          name="ficha_codigo"
          value={form.ficha_codigo}
          onChange={handleChange}
          required
          maxLength={50}
          placeholder="Ej. 3173334"
          autoComplete="off"
          className="rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
        />
        <span className="text-xs font-normal text-sena-azul/70 dark:text-sena-texto-suave">
          Aquí la escribes antes de la verificación, para no pedirla después.
        </span>
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="rounded bg-sena-oscuro p-2 font-semibold text-white transition-colors hover:bg-sena-azul disabled:opacity-60"
      >
        {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <p className="text-center text-sm text-sena-azul/80 dark:text-sena-texto-suave">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-medium text-sena-oscuro hover:text-sena hover:underline dark:text-sena-acento dark:hover:text-sena"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}
