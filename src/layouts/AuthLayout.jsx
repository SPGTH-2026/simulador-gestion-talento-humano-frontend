import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import PantallaCarga from '../components/ui/PantallaCarga'
import TarjetaAuth from '../components/ui/TarjetaAuth'
import { MensajeError } from '../components/ui/Mensaje'

// Ruta a la que se quería llegar antes del login (ProtectedRoute la guarda en location.state.from).
function destinoPrevio(state) {
  const from = state?.from
  if (!from) return null
  const ruta = typeof from === 'string' ? from : `${from.pathname ?? ''}${from.search ?? ''}`
  return ruta && ruta.startsWith('/') && !ruta.startsWith('/login') ? ruta : null
}

export default function AuthLayout() {
  const { user, authResolved, errorRed } = useAuth()
  const location = useLocation()

  if (!authResolved) {
    return <PantallaCarga operacion="sesion" />
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
    if (!user.email_verified) return <Navigate to="/verificar-correo" replace />
    // Con sesión ya iniciada se vuelve a donde se quería ir, no siempre a la portada.
    return <Navigate to={destinoPrevio(location.state) ?? '/'} replace />
  }

  return (
    <TarjetaAuth>
      {/* Entrada suave: tras cerrar sesión el login aparece sin un corte brusco. */}
      <div className="entrada-suave">
        <Outlet />
      </div>
    </TarjetaAuth>
  )
}