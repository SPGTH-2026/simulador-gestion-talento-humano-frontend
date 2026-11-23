import { CLASE_CAJA_SUAVE, CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'
import Boton from '../ui/Boton'
import Etiqueta from '../ui/Etiqueta'
import Icono from '../ui/Icono'

// Estados de la corrección que entrega el servidor (`correccion_estado`). La pantalla no recalcula la regla: solo la
// rotula. 'vigente' es el único en que se puede corregir.
const ESTADOS = {
  vigente: { tono: 'aviso', texto: (limite) => (limite ? `Plazo hasta el ${formatearFechaHora(limite)}` : 'Corrección vigente') },
  enviada: { tono: 'exito', texto: () => 'Corrección enviada' },
  vencida: { tono: 'peligro', texto: () => 'Plazo vencido' },
  inactiva: { tono: 'neutral', texto: () => 'Sin efecto' },
}

// Qué le dice la pantalla al aspirante cuando ya no hay nada que corregir.
const MENSAJES_CERRADOS = {
  enviada: (enviada) =>
    `Enviaste la corrección${enviada ? ` el ${formatearFechaHora(enviada)}` : ''}. El evaluador la revisará.`,
  vencida: () => 'El plazo para corregir terminó. Los documentos ya no se pueden reemplazar desde aquí.',
  inactiva: () => 'Tu postulación ya no está activa, por eso no se puede corregir.',
}

// Resumen de la corrección pedida: quién la pidió y qué dijo, hasta cuándo hay plazo y cuántos documentos marcados ya
// se reemplazaron DESPUÉS de la solicitud (un archivo que ya existía antes no cuenta: eso lo decide el servidor).
export function ResumenCorreccion({ correccion, total, corregidos }) {
  const estado = correccion.correccion_estado
  const datos = ESTADOS[estado] ?? ESTADOS.inactiva
  const porcentaje = total === 0 ? 0 : Math.round((corregidos / total) * 100)
  const mensajeCerrado = MENSAJES_CERRADOS[estado]

  return (
    <section className={`${CLASE_TARJETA} flex flex-col gap-3 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={CLASE_TITULO_SECCION}>Corrección solicitada por el evaluador</h2>
        <Etiqueta tono={datos.tono}>{datos.texto(correccion.fecha_limite_correccion)}</Etiqueta>
      </div>

      {correccion.observaciones && (
        <div className={`${CLASE_CAJA_SUAVE} p-3`}>
          <p className="text-sm font-medium text-sena-azul dark:text-sena-texto">Observaciones del evaluador</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-sena-texto-suave">
            {correccion.observaciones}
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
          <Icono nombre={estado === 'enviada' ? 'check' : 'alerta'} className="mt-0.5 size-4 shrink-0" />
          {mensajeCerrado(correccion.correccion_enviada_at)}
        </p>
      )}
    </section>
  )
}

// Envío de la corrección: solo existe mientras la corrección está vigente. Se habilita cuando todos los documentos
// marcados fueron reemplazados; si falta alguno, lo dice.
export function EnvioCorreccion({ correccion, total, corregidos, enviando, onEnviar }) {
  if (correccion.correccion_estado !== 'vigente') return null

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
