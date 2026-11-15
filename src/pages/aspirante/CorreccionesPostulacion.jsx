import DocumentosPostulacion from './DocumentosPostulacion'

// Ruta de correcciones del aspirante: muestra SOLO los documentos que el evaluador
// marcó con «No», con sus observaciones y el plazo para corregirlos. Reutiliza la
// página de documentos en modo corrección.
export default function CorreccionesPostulacion() {
  return <DocumentosPostulacion soloCorreccion />
}
