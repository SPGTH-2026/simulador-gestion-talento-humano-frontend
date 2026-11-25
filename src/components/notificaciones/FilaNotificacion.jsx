import { Link } from 'react-router-dom'
import Icono from '../ui/Icono'
import { CLASE_CHIP, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { accionDeNotificacion, mensajeDeNotificacion } from '../../lib/notificaciones'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'

// Una notificación, igual en el panel de la campana y en la página. Orden: título, mensaje, fecha y acciones.
// - La tarjeta NO es un botón: las acciones son enlaces de texto pequeños y hermanos entre sí (subrayan solo al pasar el puntero; con teclado se ve el anillo de foco). «Ver citación» (según el destino) es un
//   enlace real a la pantalla (marca el aviso como leído al pulsarlo); «Marcar como leída» y «Restaurar» son del mismo estilo.
// - Ocultar es un botón HERMANO (X de 44 px en la esquina). Donde hay puntero aparece al pasar sobre la tarjeta o al enfocarla con teclado;
//   en pantallas táctiles (sin hover) está siempre visible.
// - Sin leer: punto, texto «Nueva», título en negrita, fondo suave y borde lateral. Leída: sin marca, título normal y sin fondo.
// 'compacta' (panel) recorta el mensaje a 2 líneas; en la página se lee completo.
const CLASE_ENLACE =
  'inline-flex min-h-11 items-center rounded text-xs font-semibold text-sena-oscuro underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 disabled:cursor-progress disabled:opacity-60 dark:text-sena-acento'

export default function FilaNotificacion({ item, onAbrir, onMarcar, onOcultar, onRestaurar, ocupado = false, compacta = false }) {
  const accion = accionDeNotificacion(item)
  const sinLeer = !item.leida
  const puedeOcultar = onOcultar && !item.oculta
  const puedeRestaurar = onRestaurar && item.oculta
  const hayAcciones = accion || sinLeer || puedeRestaurar
  const caja = `flex w-full flex-col gap-1 rounded-xl border p-3 text-left ${puedeOcultar ? 'pr-12' : ''} ${
    sinLeer
      ? 'border-sena-linea border-l-4 border-l-sena-oscuro bg-sena-fondo pl-2 dark:border-sena-borde/70 dark:border-l-sena-acento dark:bg-white/5'
      : 'border-sena-linea bg-transparent dark:border-sena-borde/50'
  }`

  return (
    <li className="group/fila relative">
      <div className={caja}>
        <span className="flex flex-wrap items-center gap-2">
          {sinLeer && (
            <>
              <span className="sr-only">Sin leer. </span>
              <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-sena-oscuro dark:bg-sena-acento" />
            </>
          )}
          <span className={`text-sm ${sinLeer ? 'font-bold text-slate-900 dark:text-white' : `font-normal ${CLASE_TEXTO_SUAVE}`} ${CLASE_TEXTO_PARTIDO}`}>{item.titulo}</span>
          {sinLeer && <span className={CLASE_CHIP} aria-hidden="true">Nueva</span>}
        </span>
        <span className={`${compacta ? 'line-clamp-2' : 'block'} text-sm ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>{mensajeDeNotificacion(item)}</span>
        <time dateTime={item.created_at} className={`block text-xs ${CLASE_TEXTO_SUAVE}`}>{formatearFechaHora(item.created_at)}</time>
        {hayAcciones && (
          <span className="-mb-2 flex flex-wrap gap-x-4">
            {accion && (
              <Link to={item.url} onClick={() => onAbrir(item)} className={CLASE_ENLACE}>
                {accion}
              </Link>
            )}
            {sinLeer && (
              <button type="button" onClick={() => onMarcar(item)} disabled={ocupado} aria-busy={ocupado || undefined} className={CLASE_ENLACE}>
                Marcar como leída
              </button>
            )}
            {puedeRestaurar && (
              <button type="button" onClick={() => onRestaurar(item)} disabled={ocupado} aria-busy={ocupado || undefined} className={CLASE_ENLACE}>
                Restaurar
              </button>
            )}
          </span>
        )}
      </div>

      {puedeOcultar && (
        <span className="group/ocultar absolute right-1 top-1">
          <button
            type="button"
            onClick={() => onOcultar(item)}
            aria-label="Ocultar notificación"
            className="grid size-11 place-items-center rounded-full text-slate-500 transition-colors hover:bg-sena-hundido hover:text-slate-800 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 dark:text-sena-texto-suave dark:hover:bg-white/10 dark:hover:text-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/fila:opacity-100"
          >
            <Icono nombre="cerrar" className="size-4" />
          </button>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-full z-10 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-focus-within/ocultar:opacity-100 group-hover/ocultar:opacity-100 dark:bg-slate-100 dark:text-slate-900"
          >
            Ocultar notificación
          </span>
        </span>
      )}
    </li>
  )
}
