import { textoCuando } from '../../../lib/citaciones'
import { CLASE_CAJA_SUAVE, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'
import Etiqueta from '../../ui/Etiqueta'

// Una cita: actividad, estado, cuándo (hora de Colombia), dónde y las indicaciones; si está cancelada, también el motivo. Un enlace se
// muestra como enlace solo si es http o https (el backend ya lo garantiza); lo demás, como texto, sin interpretarse como HTML.
// 'titulo' (opcional) antepone un nombre, por ejemplo la convocatoria, en la vista del aspirante. 'acciones' son los botones del personal.
export default function TarjetaCita({ cita, titulo, acciones, historial = false, zona = true }) {
  const cancelada = cita.estado === 'cancelada'
  return (
    <article className={`${CLASE_CAJA_SUAVE} flex min-w-0 flex-col gap-2 p-3`} aria-label={`${cita.actividad_etiqueta}, ${cancelada ? 'cancelada' : 'programada'}`}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {titulo && <p className={`text-xs ${CLASE_TEXTO_SUAVE} [overflow-wrap:anywhere]`}>{titulo}</p>}
          <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>{cita.actividad_etiqueta}</h3>
        </div>
        <Etiqueta tono={cancelada ? 'neutral' : 'exito'}>{cancelada ? 'Cancelada' : 'Programada'}</Etiqueta>
      </header>
      <p className={`text-sm ${CLASE_TEXTO_FUERTE} ${cancelada ? 'line-through decoration-slate-400' : ''}`}>{textoCuando(cita.fecha, cita.hora, zona)}</p>
      <p className="min-w-0 text-sm text-slate-700 [overflow-wrap:anywhere] dark:text-sena-texto">
        <span className={CLASE_TEXTO_SUAVE}>{cita.es_enlace ? 'Enlace: ' : 'Lugar: '}</span>
        {cita.es_enlace ? (
          <a href={cita.lugar_o_enlace} target="_blank" rel="noopener noreferrer" className="font-semibold text-sena-oscuro underline underline-offset-2 dark:text-sena-acento">
            {cita.lugar_o_enlace}
          </a>
        ) : (
          cita.lugar_o_enlace
        )}
      </p>
      {cita.indicaciones && (
        <p className="text-sm text-slate-700 [overflow-wrap:anywhere] dark:text-sena-texto">
          <span className={CLASE_TEXTO_SUAVE}>Indicaciones: </span>
          {cita.indicaciones}
        </p>
      )}
      {cancelada && cita.motivo_cancelacion && (
        <p className="text-sm text-slate-700 [overflow-wrap:anywhere] dark:text-sena-texto">
          <span className={CLASE_TEXTO_SUAVE}>Motivo de la cancelación: </span>
          {cita.motivo_cancelacion}
        </p>
      )}
      {historial && cita.historial?.length > 0 && (
        <details className="text-xs">
          <summary className={`min-h-8 cursor-pointer py-1 font-medium ${CLASE_TEXTO_SUAVE}`}>Historial ({cita.historial.length})</summary>
          <ul className={`mt-1 flex flex-col gap-1 ${CLASE_TEXTO_SUAVE}`}>
            {cita.historial.map((e, i) => (
              <li key={i}>
                {{ programada: 'Programada', reprogramada: 'Reprogramada', cancelada: 'Cancelada' }[e.tipo] ?? e.tipo}
                {e.por ? ` por ${e.por}` : ''}
                {e.en ? ` · ${new Date(e.en).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'short', timeStyle: 'short' })}` : ''}
                {e.tipo === 'cancelada' && e.detalle?.motivo ? ` · ${e.detalle.motivo}` : ''}
              </li>
            ))}
          </ul>
        </details>
      )}
      {acciones && <div className="mt-1 flex flex-wrap gap-2">{acciones}</div>}
    </article>
  )
}
