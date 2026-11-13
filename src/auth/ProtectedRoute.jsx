import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PantallaCarga from '../components/ui/PantallaCarga'
import { useAuth } from './useAuth'

export default function ProtectedRoute() {
  const { user, authResolved, errorRed } = useAuth()
  const location = useLocation()

  // Mientras GET /auth/me no responde no se sabe quién es el usuario: esa es
  // la espera, y es lo que la pantalla dice. El error del servidor no se oculta
  // detrás de la animación: tiene su propia versión con el mensaje y un botón.
  if (!authResolved) {
    return <PantallaCarga operacion="sesion" />
  }

  if (errorRed) {
    return <PantallaCarga error={errorRed} />
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