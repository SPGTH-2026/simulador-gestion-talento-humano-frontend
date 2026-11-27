import { useEffect } from 'react'
import useVisorDocumento from '../../hooks/useVisorDocumento'

// Un solo escuchador para los botones "Ver" de TODAS las secciones (documentos requeridos, adicionales y certificados de
// skills): el archivo se muestra en el visor interno (un diálogo con el PDF), sin abrir otra pestaña. Si falla (archivo
// perdido, disco sin credenciales), el error y el botón Reintentar salen dentro del propio visor.
// Devuelve `visor`, el elemento que el panel debe pintar.
export function usePanelVerDocumentos({ idPostulacion }) {
  const { abrir, visor } = useVisorDocumento()

  useEffect(() => {
    const alVer = (evento) => {
      const { documentoId, skillId, nombre, titulo } = evento.detail ?? {}
      if (!idPostulacion) return

      const ruta = documentoId
        ? `/postulaciones/${idPostulacion}/documentos/${documentoId}/archivo?inline=1`
        : skillId
          ? `/postulaciones/${idPostulacion}/skills/${skillId}/certificado/archivo?inline=1`
          : null
      if (ruta) abrir(ruta, { titulo: titulo || nombre, nombre })
    }

    window.addEventListener('document:view', alVer)
    return () => window.removeEventListener('document:view', alVer)
  }, [idPostulacion, abrir])

  return visor
}
