import ProveedorPostulacion from './ProveedorPostulacion'
import { AvisosPostulacion, PestanaDatosPersonales, PestanaDocumentos } from './SeccionesPostulacion'
import { usePostulacion } from './contextoPostulacion'

// Panel de la postulación con TODAS las secciones apiladas en una sola pantalla (Datos personales, con su autorización,
// y Documentos). Lo usa el paso /postulaciones/:id/documentos y la pantalla de corrección. El detalle de la convocatoria
// no lo usa: ahí cada sección va en su pestaña (ver DetalleConvocatoria) y comparten el mismo ProveedorPostulacion.
//
// Funciona en dos escenarios:
//   1) SIN postulación (detalle de la convocatoria): dibuja las secciones desde
//      detalle.documentos / detalle.skills con todo en pendiente / No. La primera
//      acción de guardado dispara el BORRADOR SILENCIOSO (POST postularse), relee
//      el estado y continúa la acción. Solo mirar el formulario NO crea nada;
//      autorizar el tratamiento de datos (que los guarda) sí crea el borrador.
//   2) CON postulación (paso /postulaciones/:id/documentos): usa el GET de estado
//      como fuente de verdad.
//
// El estado del panel (GET /postulaciones/{id}/documentos) es la única fuente;
// se comparte con quien lo monta vía onEstadoChange (p. ej. para el encabezado).
export default function PanelDocumentosPostulacion(props) {
  return (
    <ProveedorPostulacion {...props}>
      <Apiladas modoCorreccion={props.modoCorreccion} />
    </ProveedorPostulacion>
  )
}

function Apiladas({ modoCorreccion = false }) {
  const { pantalla } = usePostulacion()
  // Mientras llega el estado (o si falla el acceso) se muestra una sola vez, no una por sección.
  if (pantalla) return pantalla

  return (
    <div className="flex flex-col gap-4">
      <AvisosPostulacion />
      {/* En la pantalla de corrección solo se reemplazan documentos: los datos personales no se tocan. */}
      {!modoCorreccion && <PestanaDatosPersonales conAvisos={false} />}
      <PestanaDocumentos conAvisos={false} />
    </div>
  )
}
