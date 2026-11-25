import { isValidElement } from 'react'
import { useContenidoDetalle } from './useContenidoDetalle'
import DetalleConvocatoria from '../../components/convocatorias/DetalleConvocatoria'
import ProveedorPostulacion from '../../components/postulacion/ProveedorPostulacion'

// Contenido del detalle de una convocatoria: carga, permisos, postulación y acciones de gestión.
export default function ContenidoDetalle({ id }) {
  const ctx = useContenidoDetalle({ id })
  // Mientras carga, falla o no está abierto, el hook devuelve la propia pantalla (un elemento de React) y no el contexto.
  if (ctx === null || isValidElement(ctx)) return ctx
  const { accionInferior, accionesGestion, aplicarPostulacion, detalle, errorAccion, estadoPostulacion, mostrarPanel, navigate } = ctx
  return (
    <>
      <DetalleConvocatoria
        convocatoria={detalle}
        accionesGestion={accionesGestion}
        errorAccion={errorAccion}
        onVolver={() => navigate('/convocatorias')}
        envolverPostulacion={
          mostrarPanel
            ? (pestanas) => (
                <ProveedorPostulacion
                  convocatoria={detalle}
                  documentosConvocatoria={detalle.documentos}
                  skillsConvocatoriaNombres={detalle.skills}
                  miPostulacion={detalle.mi_postulacion}
                  onPostulacionCreada={aplicarPostulacion}
                  // Salta a otra pestaña (Pestanas pone el id tab-<id> a cada botón).
                  irA={(pestana) => document.getElementById(`tab-${pestana}`)?.click()}
                  onVerDocumentos={(pid) => navigate(`/postulaciones/${pid}/documentos`)}
                  onEnviado={() =>
                    navigate('/mis-postulaciones', {
                      state: { exito: `¡Tu postulación ha sido registrada!` },
                    })
                  }
                >
                  {pestanas}
                </ProveedorPostulacion>
              )
            : null
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