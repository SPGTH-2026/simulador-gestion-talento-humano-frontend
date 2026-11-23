import { CLASE_TARJETA } from '../../../lib/estilos'
import Boton from '../../ui/Boton'
import EtiquetaPostulacion from '../EtiquetaPostulacion'

// Barra inferior del detalle: una línea, compacta y con UNA sola acción principal (la que arma la página según el
// principal (la que arma la página según el estado real del aspirante). El
// detalle decide CUÁNDO mostrarla (solo en Descripción); esconderla en
// Documentos evita repetir la acción que ya se cumplió. No hay "Siguiente":
// haría lo mismo que la acción principal (ir a Documentos). Sin acción no hay
// barra: una tarjeta vacía no dice nada.
export default function BarraInferior({ accion }) {
  if (!accion) return null

  return (
    // Solo en pantallas de teléfono ('max-sm') la barra queda fija al borde inferior: ahí es una sola línea compacta (el
    // texto de ayuda se oculta) y la acción principal siempre está a mano aunque la descripción sea larga. Desde 'sm'
    // (tableta y escritorio) va en el flujo, al final de la página: fija ocupaba dos líneas y tapaba el contenido que se
    // estaba leyendo. En ambos casos sigue en el flujo, así que al final de la página no tapa nada. En móvil solo explica
    // el motivo cuando la acción está bloqueada; la ayuda larga se muestra desde 'sm'.
    <div
      className={`${CLASE_TARJETA} flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 max-sm:sticky max-sm:-bottom-5 max-sm:z-10 max-sm:shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.25)]`}
    >
      <p className={`min-w-0 text-sm text-slate-600 dark:text-sena-texto-suave ${accion?.deshabilitado ? '' : 'max-sm:hidden'}`}>
        {accion?.deshabilitado ? accion.motivo : accion?.ayuda}
      </p>

      {accion && (
        <div className="flex flex-wrap items-center gap-2">
          {/* En teléfono la barra queda fija y debe ser de una sola línea: la etiqueta se oculta ahí (el estado ya se
              ve en la página) y queda solo la acción principal. */}
          {accion.insignia && accion.codigoEstado && (
            <span className="max-sm:hidden">
              <EtiquetaPostulacion codigo={accion.codigoEstado} nombre={accion.nombreEstado} />
            </span>
          )}
          <Boton
            variante="primario"
            tamano="tactil"
            disabled={accion.deshabilitado}
            title={accion.motivo || undefined}
            onClick={accion.onClick}
          >
            {accion.etiqueta}
          </Boton>
        </div>
      )}
    </div>
  )
}
