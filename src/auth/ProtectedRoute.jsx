import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ProtectedRoute() {
  const { user, authResolved, errorRed } = useAuth()
  const location = useLocation()

  if (!authResolved) {
    return (
      <p className="p-6 text-center text-slate-700 dark:text-sena-texto">Cargando...</p>
    )
  }

  if (errorRed) {
    return (
      <p className="p-6 text-center text-red-700 dark:text-red-400">{errorRed}</p>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // If the account's email is not verified, the user can only go to
  // /verificar-correo (created outside this layout). The business routes must
  // never be reachable until email_verified becomes true.
  if (!user.email_verified && location.pathname !== '/verificar-correo') {
    return <Navigate to="/verificar-correo" replace />
  }

  // The aspirant signs up without an instructor, so until he associates the
  // ficha he can only go to /completar-ficha. It does NOT become an aprendiz:
  // the instructor assigns the role from Usuarios.
  if (
    user.role === 'aspirante' &&
    !user.ficha &&
    location.pathname !== '/completar-ficha'
  ) {
    return <Navigate to="/completar-ficha" replace />
  }

  return <Outlet />
}