import { useContenidoDetalle } from './useContenidoDetalle'
import DetalleConvocatoria from '../../components/convocatorias/DetalleConvocatoria'
import PanelDocumentosPostulacion from '../../components/postulacion/PanelDocumentosPostulacion'

// Contenido del detalle de una convocatoria: carga, permisos, postulación y acciones de gestión.
export default function ContenidoDetalle({ id }) {
  const ctx = useContenidoDetalle({ id })
  const { accionInferior, accionesGestion, aplicarPostulacion, detalle, errorAccion, estadoPostulacion, mostrarPanel, navigate } = ctx
  return (
    <>
      <DetalleConvocatoria
        convocatoria={detalle}
        accionesGestion={accionesGestion}
        errorAccion={errorAccion}
        onVolver={() => navigate('/convocatorias')}
        panelDocumentos={
          mostrarPanel ? (
            <PanelDocumentosPostulacion
              convocatoria={detalle}
              documentosConvocatoria={detalle.documentos}
              skillsConvocatoriaNombres={detalle.skills}
              miPostulacion={detalle.mi_postulacion}
              onPostulacionCreada={aplicarPostulacion}
              onVerDocumentos={(pid) => navigate(`/postulaciones/${pid}/documentos`)}
              onEnviado={() =>
                navigate('/mis-postulaciones', {
                  state: { exito: `¡Tu postulación ha sido registrada!` },
                })
              }
            />
          ) : null
        }
        accionInferior={
          accionInferior
            ? {
                ...accionInferior,
                codigoEstado: estadoPostulacion,
                nombreEstado: detalle.mi_postulacion?.estado?.nombre,
              }
            : null
        }
      />
    </>
  )
}