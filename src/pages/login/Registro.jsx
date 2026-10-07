import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { mensajeError } from '../../api/mensajeError'

const GOOGLE_URL = import.meta.env.VITE_GOOGLE_URL ?? 'http://localhost:8000/api/auth/google/redirect'

export default function Registro() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', ficha_codigo: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      await register(form)
      navigate('/login?registro=exitoso', { replace: true })
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
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
        />
        <span className="text-xs font-normal text-sena-azul/70 dark:text-sena-texto-suave">
          Mínimo 8 caracteres, con letras y números.
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto">
        Código de ficha (opcional)
        <input
          name="ficha_codigo"
          value={form.ficha_codigo}
          onChange={handleChange}
          maxLength={50}
          placeholder="Ej. 3173334"
          autoComplete="off"
          className="rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
        />
        <span className="text-xs font-normal text-sena-azul/70 dark:text-sena-texto-suave">
          Se valida que exista. Si no la tienes, puedes dejarla después.
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
