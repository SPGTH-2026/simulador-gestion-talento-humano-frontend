import { useEffect, useState } from 'react'
import { obtenerPerfil } from '../../api/postulacionesDocumentos'

// Sexo del aspirante, necesario para la libreta militar. Se pregunta en el formulario de datos personales; aquí solo se
// lee. Manda el del estado de la postulación (el servidor lo relee tras cada guardado); mientras no hay postulación se usa
// el del perfil del usuario, que existe aunque no haya postulación.
export function usePanelPerfilSexo({ estado }) {
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

  return { sexo: estado?.sexo ?? perfil?.sexo ?? null }
}
