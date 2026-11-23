import Boton from '../ui/Boton'
import { MensajeAviso, MensajeError, MensajeExito } from '../ui/Mensaje'

// Avisos del asistente: confirmación o aviso del guardado, error del servidor, faltantes del último intento,
// fallo al cargar el catálogo (con reintento) y aviso de solo lectura. 'refMensajes' permite llevar la pantalla
// hasta el bloque tras guardar.
export default function MensajesWizard({
  refMensajes,
  exito,
  aviso,
  error,
  onVolver,
  intento,
  erroresDelIntento,
  errorCatalogo,
  onReintentarCatalogo,
  soloLectura,
  estadoNombre,
}) {
  const faltantes = Object.keys(erroresDelIntento).length

  return (
    <>
      <div ref={refMensajes} className="flex scroll-mt-4 flex-col gap-3 empty:hidden">
        {exito && (
          <MensajeExito className="flex flex-wrap items-center justify-between gap-2">
            <span>{exito}</span>
            <Boton variante="contorno" tamano="tactil" onClick={onVolver}>
              Volver al listado
            </Boton>
          </MensajeExito>
        )}
        {aviso && <MensajeAviso>{aviso}</MensajeAviso>}
        {error && <MensajeError>{error}</MensajeError>}
      </div>

      {intento && faltantes > 0 && (
        <MensajeError>
          {intento === 'publicar' ? 'No se puede publicar todavía' : 'No se puede guardar todavía'}: revisa los pasos
          marcados ({faltantes} {faltantes === 1 ? 'dato' : 'datos'}).
        </MensajeError>
      )}

      {errorCatalogo && (
        <MensajeError className="flex flex-wrap items-center justify-between gap-2">
          <span>No se pudieron cargar las listas del formulario. {errorCatalogo}</span>
          <Boton type="button" variante="contorno" onClick={onReintentarCatalogo}>
            Reintentar
          </Boton>
        </MensajeError>
      )}

      {soloLectura && (
        <MensajeAviso>
          Esta convocatoria está {estadoNombre ?? 'cerrada'} y solo se puede consultar.
        </MensajeAviso>
      )}
    </>
  )
}
