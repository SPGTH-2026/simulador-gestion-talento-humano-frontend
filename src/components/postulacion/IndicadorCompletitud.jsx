import { progresoObligatorios } from '../../lib/postulacionDocumentos'
import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

// Resumen del paso: cuántos documentos obligatorios están listos y si el paso
// queda completo. 'completo' lo decide el backend (todos los obligatorios
// subidos o en 'no_aplica').
export default function IndicadorCompletitud({ estado }) {
  const { cumplidos, total } = progresoObligatorios(estado.documentos)
  const completo = Boolean(estado.completo)
  const porcentaje = total === 0 ? 100 : Math.round((cumplidos / total) * 100)

  return (
    <section className={ESTILO_TARJETA}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={ESTILO_TITULO}>Estado de tus documentos</h2>
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            completo
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {completo ? 'Completo' : 'Incompleto'}
        </span>
      </div>

      <p className="mt-1 text-sm text-slate-600 dark:text-sena-texto-suave">
        {total === 0
          ? 'Esta convocatoria no exige documentos obligatorios.'
          : `${cumplidos} de ${total} documento(s) obligatorio(s) listo(s).`}
      </p>

      {total > 0 && (
        <div
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-sena-superficie-alta"
        >
          <div
            className={`h-full rounded-full transition-all ${
              completo ? 'bg-emerald-500' : 'bg-sena'
            }`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      )}
    </section>
  )
}
