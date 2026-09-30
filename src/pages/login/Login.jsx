import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { mensajeError } from '../../api/mensajeError'
import GoogleCallback from './GoogleCallback'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)

    try {
      await login(email, password)
      // AuthLayout detecta la sesión y redirige solo
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  // Google necesita navegar de verdad (no axios): el backend redirige a Google
  const entrarConGoogle = () => {
    window.location.href = `${API_URL}/auth/google/redirect`
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Iniciar sesión</h2>

      <GoogleCallback />

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Correo
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="rounded border border-slate-300 p-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="rounded border border-slate-300 p-2"
        />
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>

      <button
        type="button"
        onClick={entrarConGoogle}
        className="rounded border border-slate-300 p-2 font-medium hover:bg-slate-50"
      >
        Entrar con Google
      </button>

      <p className="text-center text-sm">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="text-blue-600 hover:underline">
          Crear cuenta de aspirante
        </Link>
      </p>
    </form>
  )
}
