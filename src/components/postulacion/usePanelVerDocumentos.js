import { useEffect } from 'react'
import { abrirArchivoEnPestana, mensajeErrorBlob } from '../../api/postulacionesDocumentos'
import { mensajeError } from '../../api/mensajeError'

// Un solo escuchador para los botones "Ver" de TODAS las secciones (documentos requeridos, adicionales y certificados de
// skills): el archivo se pide con la sesión y se abre en una pestaña nueva desde el blob. Si falla (archivo perdido,
// disco sin credenciales), el error se muestra en el panel.
export function usePanelVerDocumentos({ idPostulacion, setError }) {
  useEffect(() => {
    const abrirEnPestana = async (evento) => {
      const { documentoId, skillId, nombre } = evento.detail ?? {}
      if (!idPostulacion) return

      const ruta = documentoId
        ? `/postulaciones/${idPostulacion}/documentos/${documentoId}/archivo?inline=1`
        : skillId
          ? `/postulaciones/${idPostulacion}/skills/${skillId}/certificado/archivo?inline=1`
          : null

      if (!ruta) return

      setError('')

      try {
        await abrirArchivoEnPestana(ruta, { nombre })
      } catch (error) {
        const mensaje = await mensajeErrorBlob(error)
        setError(mensaje || mensajeError(error))
      }
    }

    window.addEventListener('document:view', abrirEnPestana)
    return () => window.removeEventListener('document:view', abrirEnPestana)
  }, [idPostulacion, setError])
}
