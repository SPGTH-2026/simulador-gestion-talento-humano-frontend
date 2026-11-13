import Icono from '../ui/Icono'
import {
  CLASE_TARJETA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'
import { UMBRAL_CUMPLIMIENTO } from '../../lib/evaluacion'
import { Resultado } from './PresentacionEvaluacion'

// Cumplimiento del perfil. Mientras la evaluación no está completada es
// PROVISIONAL: sigue lo que el evaluador lleva marcado, con presentación neutra
// y sin dar por perdido ni por ganado nada. El veredicto (pasa / no pasa) solo
// aparece cuando existe un resultado guardado como completado, con los valores
// que devolvió el backend.
export default function ResumenCumplimiento({
  evaluacion,
  porcentaje,
  cumplidos,
  total,
  sinResponder,
  sinSubir,
}) {
  const completada = evaluacion?.estado === 'finalizada'
  const guardado = Math.round(evaluacion?.cumplimiento ?? 0)
  const mostrado = completada ? guardado : porcentaje
  const alcanza = porcentaje >= UMBRAL_CUMPLIMIENTO

  return (
    <section aria-labelledby="resumen-titulo" className={`${CLASE_TARJETA} p-4`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="resumen-titulo" className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
          {completada ? 'Cumplimiento del perfil' : 'Cumplimiento provisional'}
        </h2>
        <p className={`text-2xl font-bold tabular-nums ${CLASE_TEXTO_FUERTE}`} aria-live="polite">
          {mostrado} %
        </p>
      </div>
      <div
        role="progressbar"
        aria-label="Cumplimiento del perfil"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={mostrado}
        className="mt-2 h-2 overflow-hidden rounded-full bg-sena-hundido dark:bg-sena-borde"
      >
        <div
          className="h-full rounded-full bg-sena-azul transition-[width] duration-300 motion-reduce:transition-none dark:bg-sena-texto"
          style={{ width: `${mostrado}%` }}
        />
      </div>

      <p className={`mt-3 text-sm ${CLASE_TEXTO_FUERTE}`}>
        {cumplidos} de {total} requisitos cumplidos
        {sinResponder > 0 && ` · ${sinResponder} sin responder`}
      </p>

      {completada ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Resultado evaluacion={evaluacion} />
          <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Mínimo {UMBRAL_CUMPLIMIENTO}&nbsp;%</span>
        </div>
      ) : (
        <p className={`mt-1 flex items-start gap-1.5 text-sm ${CLASE_TEXTO_SUAVE}`}>
          <Icono nombre={alcanza ? 'check' : 'reloj'} className="mt-0.5 size-4 shrink-0" />
          {alcanza
            ? `Por ahora alcanza el mínimo de ${UMBRAL_CUMPLIMIENTO} %.`
            : `Por ahora, por debajo del mínimo de ${UMBRAL_CUMPLIMIENTO} %.`}
        </p>
      )}

      {completada && porcentaje !== guardado && (
        <p className={`mt-2 text-xs ${CLASE_TEXTO_SUAVE}`}>
          Tus marcas actuales darían {porcentaje}&nbsp;%: guarda para actualizar el resultado.
        </p>
      )}

      {sinSubir > 0 && (
        <p className={`mt-3 border-t border-sena-linea/70 pt-3 text-xs dark:border-sena-borde/50 ${CLASE_TEXTO_SUAVE}`}>
          {sinSubir === 1
            ? '1 documento sin subir por el aspirante.'
            : `${sinSubir} documentos sin subir por el aspirante.`}
        </p>
      )}
    </section>
  )
}
