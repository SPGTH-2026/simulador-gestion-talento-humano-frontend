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
      <h2 className="text-xl font-semibold">Crear cuenta de aspirante</h2>

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Nombre completo
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          autoComplete="name"
          className="rounded border border-slate-300 p-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Correo
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
          className="rounded border border-slate-300 p-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded border border-slate-300 p-2"
        />
        <span className="text-xs text-slate-500">
          Mínimo 8 caracteres, con letras y números.
        </span>
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <p className="text-center text-sm">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}
