import { IconoX } from '../../../components/convocatorias/Iconos'

import Campo from '../../../components/ui/Campo'
import { CLASE_CAMPO, CLASE_TARJETA_PLANA } from '../../../lib/estilos'

// Piezas visuales del listado de evaluaciones: esqueleto de carga, filtros y chips.
export function Hueco({ className = '' }) {
  return (
    <span
      className={`block rounded bg-sena-hundido motion-safe:animate-pulse dark:bg-sena-superficie-alta ${className}`}
    />
  )
}

export function HuecoPersona({ avatar, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Hueco className={`${avatar} shrink-0 rounded-full`} />
      <div className="flex-1 space-y-2">
        <Hueco className="h-3 w-3/4" />
        <Hueco className="h-2.5 w-1/2" />
      </div>
    </div>
  )
}

// Estado de carga cuando no hay filas que conservar: la carga inicial o una
// búsqueda sobre una lista vacía. Reserva el mismo espacio que la tabla o las
// tarjetas para que el contenido no salte al llegar. 'texto' es lo que anuncia
// el lector de pantalla.
export function EsqueletoListado({ texto }) {
  return (
    <div role="status">
      <span className="sr-only">{texto}</span>

      <div className="hidden @min-[940px]:block" aria-hidden="true">
        <div className={`${CLASE_TARJETA_PLANA} overflow-hidden`}>
          <div className="border-b border-sena-linea bg-sena-fondo/60 px-4 py-4 dark:border-sena-borde dark:bg-sena-noche/30">
            <Hueco className="h-3 w-1/3" />
          </div>
          <div className="divide-y divide-sena-hundido dark:divide-sena-borde">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-6 px-4 py-4">
                <HuecoPersona avatar="size-8" className="w-1/4" />
                <Hueco className="h-3 w-1/5" />
                <Hueco className="h-2 w-1/6" />
                <Hueco className="h-4 w-10" />
                <Hueco className="h-5 w-24 rounded-full" />
                <Hueco className="ml-auto h-11 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="grid gap-3 @min-[600px]:grid-cols-2 @min-[940px]:hidden" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className={`${CLASE_TARJETA_PLANA} flex flex-col gap-4 p-4`}>
            <HuecoPersona avatar="size-10" />
            <Hueco className="h-3 w-4/5" />
            <Hueco className="h-2 w-full" />
            <Hueco className="h-11 w-full rounded-lg" />
          </li>
        ))}
      </ul>
    </div>
  )
}

// Campo de filtro con su lista de opciones y la opción "todas".
export function FiltroSelect({ etiqueta, valor, onElegir, todas, opciones }) {
  return (
    <Campo etiqueta={etiqueta}>
      <select value={valor} onChange={(e) => onElegir(e.target.value)} className={CLASE_CAMPO}>
        <option value="">{todas}</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.texto}
          </option>
        ))}
      </select>
    </Campo>
  )
}

// Chip de un filtro activo: al pulsarlo se quita ese filtro. Es una píldora y
// no un Boton (que es rectangular); mide 44 px de alto.
export function ChipFiltro({ tipo, texto, onQuitar }) {
  return (
    <button
      type="button"
      onClick={onQuitar}
      aria-label={`Quitar filtro de ${tipo.toLowerCase()}: ${texto}`}
      className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-sena-azul/60 bg-sena-fondo px-4 text-sm font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 motion-reduce:transition-none dark:border-sena-texto-suave/70 dark:bg-sena-noche/40 dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
    >
      <span className="max-w-[14rem] truncate">
        <span className="font-normal">{tipo}: </span>
        {texto}
      </span>
      <IconoX className="h-4 w-4 shrink-0" />
    </button>
  )
}
