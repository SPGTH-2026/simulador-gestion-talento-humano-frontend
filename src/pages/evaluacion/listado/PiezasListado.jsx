import { IconoX } from '../../../components/convocatorias/Iconos'

import Campo from '../../../components/ui/Campo'
import { Hueco, EsqueletoTabla, EsqueletoTarjetas } from '../../../components/ui/Esqueleto'
import { CLASE_CAMPO } from '../../../lib/estilos'

// Piezas visuales del listado de evaluaciones: esqueleto de carga, filtros y chips.
// El esqueleto usa las piezas compartidas (ui/Esqueleto): tabla desde 940 px de contenedor y tarjetas por debajo. Reserva el
// mismo espacio que el contenido real para que no salte al llegar. 'texto' es lo que anuncia el lector de pantalla.
export { Hueco }
export function EsqueletoListado({ texto }) {
  return (
    <>
      <EsqueletoTabla
        texto={texto}
        filas={6}
        encabezados={[
          { texto: 'Aspirante' },
          { texto: 'Convocatoria' },
          { texto: 'Documentos cargados' },
          { texto: 'Cumplimiento' },
          { texto: 'Evaluación' },
          { texto: 'Acciones', clase: 'text-center' },
        ]}
        plantilla="grid-cols-[26%_minmax(0,1fr)_9.5rem_5.5rem_11rem_7rem]"
        pie
        textoPie={texto}
        className="hidden @min-[940px]:block"
      />
      <EsqueletoTarjetas texto={texto} n={3} pie textoPie={texto} className="@min-[940px]:hidden" />
    </>
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
