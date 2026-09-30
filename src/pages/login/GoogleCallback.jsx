import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { mensajeError } from '../../api/mensajeError'

const MENSAJES = {
  oauth: 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.',
  sin_correo: 'Tu cuenta de Google no compartió un correo, así que no podemos crear tu acceso.',
  correo_en_uso: 'Ese correo ya está registrado con contraseña. Entra con tu correo y contraseña.',
  desactivado: 'Tu usuario está desactivado. Contacta al instructor.',
}

export default function GoogleCallback() {
  const { loginConToken } = useAuth()
  const [estado, setEstado] = useState({ entrando: false, error: '' })
  // Candado: en desarrollo React corre los efectos dos veces
  const yaProcesado = useRef(false)

  useEffect(() => {
    if (yaProcesado.current) return
    yaProcesado.current = true

    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    const codigo = new URLSearchParams(window.location.search).get('error')

    if (!token && !codigo) return

    // Borrar el token y el error de la barra de direcciones ya mismo
    window.history.replaceState(null, '', window.location.pathname)

    if (token) {
      setEstado({ entrando: true, error: '' })
      loginConToken(token).catch((err) =>
        setEstado({ entrando: false, error: mensajeError(err) }),
      )
      return
    }

    setEstado({ entrando: false, error: MENSAJES[codigo] ?? MENSAJES.oauth })
  }, [loginConToken])

  if (estado.entrando) {
    return (
      <p className="rounded bg-blue-50 p-3 text-sm text-blue-700">
        Entrando con Google...
      </p>
    )
  }

  if (estado.error) {
    return (
      <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700">
        {estado.error}
      </p>
    )
  }

  return null
}
