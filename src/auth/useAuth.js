import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }

  const permissions = context.user?.permissions ?? []

  // ¿Tiene este permiso exacto? Ej: can('documentos:validar')
  const can = (permiso) => permissions.includes(permiso)

  // ¿Tiene al menos uno de estos? Ej: hasAny(['evaluacion:ver', 'seleccion:ver'])
  const hasAny = (lista) => lista.some((permiso) => permissions.includes(permiso))

  return { ...context, can, hasAny }
}
