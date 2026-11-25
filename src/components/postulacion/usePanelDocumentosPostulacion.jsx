import { isValidElement, useCallback, useState } from 'react'
import { useVistaDocumentos } from './useVistaDocumentos'
import { cambiarEstadoPostulacion } from '../../api/postulaciones'
import { mensajeError } from '../../api/mensajeError'
import { useAuth } from '../../auth/useAuth'
import { estadoVentana } from '../../lib/ventanaPostulacion'
import { CODIGO_LIBRETA_MILITAR } from '../../lib/postulacionDocumentos'
import { usePanelEstadoDocumentos } from './usePanelEstadoDocumentos'
import { usePanelCorreccion } from './usePanelCorreccion'
import { usePanelPerfilSexo } from './usePanelPerfilSexo'
import { usePanelVerDocumentos } from './usePanelVerDocumentos'

// Estado del panel de documentos de una postulación. Se reparte en cuatro piezas con una sola responsabilidad cada una:
// el estado del servidor (usePanelEstadoDocumentos), la corrección del evaluador (usePanelCorreccion), el sexo del
// aspirante, solo lectura (usePanelPerfilSexo) y el visor de archivos (usePanelVerDocumentos). Aquí se componen y se decide la vista
// (useVistaDocumentos). Devuelve únicamente lo que usa PanelDocumentosPostulacion.
export function usePanelDocumentosPostulacion({
  postulacionId = null,
  convocatoria = null,
  documentosConvocatoria = null,
  skillsConvocatoriaNombres = null,
  miPostulacion = null,
  onEstadoChange,
  onPostulacionCreada,
  modoCorreccion = false,
  onCorreccionEnviada,
}) {
  const { user } = useAuth()
  const rol = user?.role

  const documentos = usePanelEstadoDocumentos({ postulacionId, miPostulacion, convocatoria, onEstadoChange, onPostulacionCreada })
  const { idPostulacion, estado, error, setError, asegurar, idVigente, releerEstado } = documentos

  const correccionPanel = usePanelCorreccion({ idPostulacion, rol, onCorreccionEnviada, setError })
  const { correccion, marcados, infoCorreccion, correccionVigente, corregidos, enviandoCorreccion, enviarCorreccionAhora, releerCorreccion } = correccionPanel

  const { sexo } = usePanelPerfilSexo({ estado })
  const visor = usePanelVerDocumentos({ idPostulacion })

  const [aviso, setAviso] = useState('')
  const [reactivando, setReactivando] = useState(false)

  // El id sale del ref (idVigente): tras crear el borrador, este «recargar» puede ser el del render anterior, sin id en su
  // closure.
  const recargar = useCallback(() => {
    const id = idVigente()
    if (!id) return Promise.resolve()
    return Promise.all([releerEstado(id), releerCorreccion(id)])
  }, [idVigente, releerEstado, releerCorreccion])

  // "Volver a postularme": PATCH estado 'postulada' (retirada -> postulada). El backend valida ventana y obligatorios; si
  // faltan, la postulación queda retirada.
  const volverAPostularme = async () => {
    if (reactivando) return
    setReactivando(true)
    setError('')
    setAviso('')
    try {
      await cambiarEstadoPostulacion(idPostulacion, 'postulada')
      await recargar()
      setAviso('Tu postulación quedó postulada de nuevo.')
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setReactivando(false)
    }
  }

  const pideLibretaConv = (estado?.documentos ?? documentosConvocatoria ?? []).some(
    (d) => (d.parametro?.codigo ?? d.codigo) === CODIGO_LIBRETA_MILITAR,
  )
  const ventana = estado?.ventana ?? estadoVentana(convocatoria)

  const vistaDocs = useVistaDocumentos({
    convocatoria,
    correccionVigente,
    documentosConvocatoria,
    error,
    estado,
    idPostulacion,
    modoCorreccion,
    pideLibretaConv,
    sexo,
    skillsConvocatoriaNombres,
    user,
    ventana,
  })
  // Mientras carga el estado (o si falla el acceso), useVistaDocumentos devuelve la propia pantalla (un elemento de React).
  if (isValidElement(vistaDocs)) return vistaDocs
  const { editable, editableDatos, esBorrador, esRetirada, motivo, motivoVolver, puedeVolver, vista } = vistaDocs

  return {
    asegurar,
    aviso,
    correccion,
    correccionVigente,
    corregidos,
    editable,
    editableDatos,
    enviandoCorreccion,
    enviarCorreccionAhora,
    error,
    esBorrador,
    esRetirada,
    infoCorreccion,
    marcados,
    motivo,
    motivoVolver,
    puedeVolver,
    reactivando,
    recargar,
    setError,
    sexo,
    vista,
    visor,
    volverAPostularme,
  }
}
