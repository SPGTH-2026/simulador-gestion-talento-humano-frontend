import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { mensajeError } from '../../api/mensajeError'

export default function Registro() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
      // AuthLayout detecta la sesión y redirige solo
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
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

      <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto dark:text-sena-texto">
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
