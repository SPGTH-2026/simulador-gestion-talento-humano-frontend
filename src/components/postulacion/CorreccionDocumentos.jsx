import { CLASE_CAJA_SUAVE, CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import { ESTADO_RONDA, MENSAJES_CERRADOS, nombreRonda, textoPlazo } from '../../lib/correcciones'
import Boton from '../ui/Boton'
import Etiqueta from '../ui/Etiqueta'
import Icono from '../ui/Icono'

// Resumen de la ronda de corrección: quién la pidió y qué dijo, hasta cuándo hay plazo (fecha y hora exactas) y cuántos
// documentos marcados ya se reemplazaron DESPUÉS de la solicitud (un archivo que ya existía no cuenta: lo decide el
// servidor). Si hubo rondas anteriores, queda su historial.
export function ResumenCorreccion({ resumen, total, corregidos }) {
  const ronda = resumen.ronda_actual
  const datos = ESTADO_RONDA[ronda.estado] ?? ESTADO_RONDA.sin_plazo
  const porcentaje = total === 0 ? 0 : Math.round((corregidos / total) * 100)
  const mensajeCerrado = MENSAJES_CERRADOS[ronda.estado]
  const anteriores = (resumen.historial ?? []).slice(0, -1)

  return (
    <section className={`${CLASE_TARJETA} flex flex-col gap-3 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={CLASE_TITULO_SECCION}>
          Corrección solicitada por el evaluador
          <span className="ml-2 text-sm font-normal text-slate-600 dark:text-sena-texto-suave">
            {nombreRonda(ronda)}
            {ronda.tipo === 'ordinaria' ? ` de ${resumen.ordinarias_max}` : ''}
          </span>
        </h2>
        <Etiqueta tono={datos.tono}>{datos.texto}</Etiqueta>
      </div>

      <p className="text-sm font-medium text-slate-700 dark:text-sena-texto">
        {textoPlazo(ronda)}
        {ronda.estado === 'vigente' && (
          <span className="font-normal text-slate-600 dark:text-sena-texto-suave"> (hora de Colombia)</span>
        )}
      </p>

      {ronda.observaciones && (
        <div className={`${CLASE_CAJA_SUAVE} p-3`}>
          <p className="text-sm font-medium text-sena-azul dark:text-sena-texto">
            Observaciones{ronda.solicitada_por?.name ? ` de ${ronda.solicitada_por.name}` : ' del evaluador'}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-sena-texto-suave">
            {ronda.observaciones}
          </p>
        </div>
      )}

      {total > 0 && (
        <div>
          <p className="text-sm text-slate-700 dark:text-sena-texto">
            <span className="font-semibold tabular-nums">
              {corregidos} de {total}
            </span>{' '}
            {total === 1 ? 'documento corregido' : 'documentos corregidos'}
          </p>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={porcentaje}
            aria-label="Documentos corregidos"
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sena-hundido dark:bg-sena-superficie-alta"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none ${
                corregidos === total ? 'bg-exito' : 'bg-sena'
              }`}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      )}

      {mensajeCerrado && (
        <p className="flex items-start gap-2 text-sm text-slate-700 dark:text-sena-texto-suave">
          <Icono nombre={ronda.estado === 'respondida' ? 'check' : 'alerta'} className="mt-0.5 size-4 shrink-0" />
          {mensajeCerrado(ronda)}
        </p>
      )}

      {anteriores.length > 0 && (
        <details className="text-sm text-slate-700 dark:text-sena-texto-suave">
          <summary className="cursor-pointer font-medium text-sena-azul dark:text-sena-texto">
            Rondas anteriores ({anteriores.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {anteriores.map((anterior) => (
              <li key={anterior.id ?? `${anterior.tipo}-${anterior.numero}`}>
                <span className="font-medium">{nombreRonda(anterior)}:</span> {textoPlazo(anterior)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

// Envío de la corrección: solo existe mientras la ronda está vigente. Se habilita cuando todos los documentos marcados
// fueron reemplazados; si falta alguno, lo dice.
export function EnvioCorreccion({ resumen, total, corregidos, enviando, onEnviar }) {
  if (resumen.ronda_actual?.estado !== 'vigente') return null

  const faltan = total - corregidos
  const completo = faltan <= 0

  return (
    <section className={`${CLASE_TARJETA} flex flex-col gap-3 p-4`}>
      <h2 className={CLASE_TITULO_SECCION}>Enviar la corrección</h2>
      <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
        {completo
          ? 'Ya reemplazaste todos los documentos marcados. Envía la corrección para que el evaluador la revise.'
          : faltan === 1
            ? 'Falta 1 documento por reemplazar antes de poder enviar.'
            : `Faltan ${faltan} documentos por reemplazar antes de poder enviar.`}
      </p>
      <div>
        <Boton variante="primario" tamano="tactil" ocupado={enviando} disabled={!completo} onClick={onEnviar}>
          {enviando ? 'Enviando…' : 'Enviar corrección'}
        </Boton>
      </div>
    </section>
  )
}
