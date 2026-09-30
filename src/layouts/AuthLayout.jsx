import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export default function AuthLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="p-6 text-center">Cargando...</p>
  }

  // Si ya hay sesión, no tiene sentido ver login o registro
  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-1 text-center text-2xl font-bold">SPGTH</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Simulador de Procesos de Gestión de Talento Humano
        </p>
        <Outlet />
      </div>
    </div>
  )
}
