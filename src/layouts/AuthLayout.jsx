import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import TarjetaAuth from '../components/ui/TarjetaAuth'
import { MensajeError } from '../components/ui/Mensaje'

export default function AuthLayout() {
  const { user, authResolved, errorRed } = useAuth()

  if (!authResolved) {
    return <p className="p-6 text-center dark:text-sena-texto">Cargando...</p>
  }

  // With the server down we can neither log in nor render the form
  // reliably, so we tell the user what is wrong.
  if (errorRed) {
    return (
      <TarjetaAuth>
        <MensajeError>{errorRed}</MensajeError>
      </TarjetaAuth>
    )
  }

  // If there is already a session, it makes no sense to see login or register.
  if (user) {
    return <Navigate to={user.email_verified ? '/' : '/verificar-correo'} replace />
  }

  return (
    <TarjetaAuth>
      <Outlet />
    </TarjetaAuth>
  )
}