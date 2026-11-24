import { useEffect, useState } from 'react'
import { obtenerPerfil } from '../../api/postulacionesDocumentos'

// Sexo del aspirante, necesario para la libreta militar. Es del usuario, así que se carga aunque no haya postulación.
export function usePanelPerfilSexo({ estado, setError }) {
  const [perfil, setPerfil] = useState(null)

  useEffect(() => {
    let activo = true
    obtenerPerfil()
      .then((data) => {
        if (activo) setPerfil(data)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  const sexo = perfil?.sexo ?? estado?.sexo ?? null

  const alGuardarSexo = (sexoNuevo) => {
    setPerfil((prev) => ({ ...(prev ?? {}), sexo: sexoNuevo }))
    setError('')
  }

  return { sexo, alGuardarSexo }
}
