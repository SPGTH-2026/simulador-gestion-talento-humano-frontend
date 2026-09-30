import { Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import Forbidden from '../pages/errores/Forbidden'

// permiso: un string ('usuarios:gestionar') o una lista (basta con tener uno)
export default function PermissionRoute({ permiso }) {
  const { hasAny } = useAuth()

  const lista = Array.isArray(permiso) ? permiso : [permiso]

  if (!hasAny(lista)) {
    return <Forbidden />
  }

  return <Outlet />
}
