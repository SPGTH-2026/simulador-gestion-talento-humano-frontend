import { EtiquetaConIcono } from '../../evaluacion/PresentacionEvaluacion'
import Icono from '../../ui/Icono'
import { CLASE_TEXTO_SUAVE } from '../../../lib/estilos'
import { SUGERENCIA } from '../../../lib/seleccion'

export function EtiquetaSugerencia({ codigo }) {
  const s = SUGERENCIA[codigo]
  if (!s) return null
  return (
    <EtiquetaConIcono tono={s.tono} icono={s.icono ? <Icono nombre={s.icono} className="size-3.5" /> : null}>
      {s.texto}
    </EtiquetaConIcono>
  )
}

export function SinDato({ lectura }) {
  return (
    <span className={CLASE_TEXTO_SUAVE}>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{lectura}</span>
    </span>
  )
}

// Ranking de los candidatos listos de UNA convocatoria, objetivo de finalistas y confirmación de la lista.
// El servidor ordena, asigna posiciones, sugiere y detecta empates; aquí solo se muestra y se elige.
// La selección vive en un Map (id -> fila) para sobrevivir al cambio de página. El padre lo monta con
// 'key' = id de la convocatoria.
// 'activo': la pestaña está a la vista. El ranking se pide la primera vez que se abre y al volver no se repite
// (salvo que algo lo haya invalidado: un guardado, una confirmación o un 409 piden la recarga explícita).
