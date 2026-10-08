import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ProtectedRoute() {
  const { user, authResolved, errorRed } = useAuth()
  const location = useLocation()

  if (!authResolved) {
    return (
      <p className="p-6 text-center text-slate-700 dark:text-sena-texto">
        Cargando...
      </p>
    )
  }

  if (errorRed) {
    return (
      <p className="p-6 text-center text-red-700 dark:text-red-400">
        {errorRed}
      </p>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // PRIORIDAD 1:
  // El usuario primero debe verificar su correo.
  // Mientras no esté verificado, únicamente puede estar en /verificar-correo.
  if (!user.email_verified) {
    if (location.pathname !== '/verificar-correo') {
      return <Navigate to="/verificar-correo" replace />
    }

    return <Outlet />
  }

  // PRIORIDAD 2:
  // Solo después de verificar el correo revisamos si el aspirante tiene ficha.
  if (user.role === 'aspirante' && !user.ficha) {
    if (location.pathname !== '/completar-ficha') {
      return <Navigate to="/completar-ficha" replace />
    }

    return <Outlet />
  }

  return <Outlet />
}