import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import TarjetaAuth from '../components/ui/TarjetaAuth'

export default function AuthLayout() {
  const { user, authResolved, errorRed } = useAuth()
  const { pathname } = useLocation()

  // La paleta institucional SENA se aplica solo al login; el resto de pantallas
  // públicas conservan el estilo neutro.
  const marca = pathname === '/login' ? 'sena' : undefined

  if (!authResolved) {
    return <p className="p-6 text-center">Cargando...</p>
  }

  // With the server down we can neither log in nor render the form
  // reliably, so we tell the user what is wrong.
  if (errorRed) {
    return (
      <TarjetaAuth marca={marca}>
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
          {errorRed}
        </p>
      </TarjetaAuth>
    )
  }

  // If there is already a session, it makes no sense to see login or register.
  if (user) {
    return <Navigate to={user.email_verified ? '/' : '/verificar-correo'} replace />
  }

  return (
    <TarjetaAuth marca={marca}>
      <Outlet />
    </TarjetaAuth>
  )
}