import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import Icono from '../ui/Icono'
import { MensajeAviso } from '../ui/Mensaje'
import PanelCalificaciones from './PanelCalificaciones'
import Valor from './Valor'
import {
  CLASE_CAJA_SUAVE,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'
import {
  MOTIVO_REVISION_DECISION,
  diferencias,
  estadoDocumental,
  formatoFechaHora,
  textoCumplimiento,
  textoNota,
} from '../../lib/seleccion'

function Dato({ titulo, children }) {
  return (
    <div className={`${CLASE_CAJA_SUAVE} p-3`}>
      <dt className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>{titulo}</dt>
      <dd className="mt-1 text-lg font-bold">{children}</dd>
    </div>
  )
}

// Posición y resultado que conservó una versión de la lista. Son lo único que la lista congela: el desglose por actividad
// no se guarda, por eso este bloque no lo muestra.
function BloqueVersion({ titulo, detalle, posicion, resultado, nota }) {
  return (
    <section className="flex flex-col gap-2" aria-label={titulo}>
      <div>
        <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>{titulo}</h3>
        {detalle && <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{detalle}</p>}
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <Dato titulo="Posición">
          <Valor valor={posicion} sinDato="Sin posición registrada" />
        </Dato>
        <Dato titulo="Resultado">
          <Valor valor={resultado == null ? null : textoNota(resultado)} sinDato="Sin resultado registrado" />
        </Dato>
      </dl>
      {nota && <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{nota}</p>}
    </section>
  )
}

function textoCambio(c) {
  const nombre = c.campo === 'resultado' ? 'el resultado' : 'la posición'
  const f = (v) => (v == null ? 'sin dato' : c.campo === 'resultado' ? textoNota(v) : String(v))
  return `${nombre} pasó de ${f(c.antes)} a ${f(c.ahora)}`
}

// Evidencia de UN finalista para decidir sobre él. Separa tres cosas que NO son lo mismo:
//  1) lo que conservó la lista confirmada (posición y resultado, congelados),
//  2) lo de hoy (Ranking vivo) y
//  3) las notas, pesos y correcciones de hoy (desglose vivo, no una copia de lo que había al confirmar).
// Los datos de 1) y 2) llegan con la fila de Decidir; el desglose se pide al montarse (al abrir el detalle).
export default function EvidenciaFinalista({ convocatoriaId, fila, lista, puedeDecidir }) {
  const { confirmada, actual, sustento } = fila
  const doc = actual ? estadoDocumental(actual.estado_documental) : null
  const sinActividades = lista?.modo === 'sin_actividades'

  // Contra qué se compara lo de hoy: lo que conservó la lista vigente o, si salió de ella, la versión de su decisión.
  const base = confirmada ?? (sustento?.pertenece ? sustento : null)
  const cambios = diferencias(base, actual)
  const motivo = fila.motivo_revision && fila.motivo_revision !== 'fuera_de_lista' ? MOTIVO_REVISION_DECISION[fila.motivo_revision] : null
  // La versión de la decisión solo se muestra aparte si no es la misma que la vigente.
  const sustentoAparte = sustento && sustento.lista_version !== confirmada?.lista_version

  return (
    <div className="flex flex-col gap-5">
      {confirmada ? (
        <BloqueVersion
          titulo={`Lista confirmada · versión ${confirmada.lista_version}`}
          detalle={[
            'Lista vigente',
            lista?.confirmada_en && `confirmada por ${lista.confirmada_por ?? 'un usuario'}`,
            lista?.confirmada_en && formatoFechaHora(lista.confirmada_en),
            sustento?.lista_version === confirmada.lista_version && 'su decisión se registró con esta versión',
          ]
            .filter(Boolean)
            .join(' · ')}
          posicion={confirmada.posicion}
          resultado={confirmada.resultado}
          nota={
            confirmada.posicion == null && confirmada.resultado == null
              ? sinActividades
                ? 'Convocatoria sin actividades: la lista no registra posición ni resultado. La elección es manual y se apoya en la habilitación documental.'
                : 'La lista no registró posición ni resultado para este candidato.'
              : undefined
          }
        />
      ) : (
        <MensajeAviso>
          La lista vigente{lista ? ` (versión ${lista.version})` : ''} no incluye a este candidato.
        </MensajeAviso>
      )}

      {sustentoAparte &&
        (sustento.pertenece ? (
          <BloqueVersion
            titulo={`Versión registrada en su decisión · versión ${sustento.lista_version}`}
            detalle={sustento.confirmada_en ? `Lista confirmada el ${formatoFechaHora(sustento.confirmada_en)}` : undefined}
            posicion={sustento.posicion}
            resultado={sustento.resultado}
          />
        ) : (
          <section className="flex flex-col gap-1" aria-label={`Versión registrada en su decisión, versión ${sustento.lista_version ?? 'sin versión'}`}>
            <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
              Versión registrada en su decisión{sustento.lista_version != null ? ` · versión ${sustento.lista_version}` : ''}
            </h3>
            <p className={`${CLASE_CAJA_SUAVE} p-3 text-sm ${CLASE_TEXTO_FUERTE}`}>
              {sustento.lista_version != null
                ? `La versión ${sustento.lista_version} no contiene posición ni resultado para este candidato. Suele ocurrir cuando la decisión se rectificó para liberar un cupo estando fuera de la lista: se registra la versión vigente en ese momento.`
                : 'Su decisión no registra una versión de la lista, así que no hay posición ni resultado de una versión que mostrar.'}
            </p>
          </section>
        ))}

      <section className="flex flex-col gap-3" aria-label="Situación de hoy">
        <div>
          <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Hoy · Ranking actual</h3>
          <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Se calcula con las notas y la habilitación de ahora; puede diferir de lo confirmado.</p>
        </div>

        {actual ? (
          <>
            <dl className="grid grid-cols-2 gap-3 @min-[520px]:grid-cols-4">
              <Dato titulo="Posición">
                <Valor valor={actual.posicion} sinDato={actual.listo ? 'Sin posición: la convocatoria no tiene actividades' : 'Sin posición: aún no está listo'} />
              </Dato>
              <Dato titulo="Resultado">
                <Valor valor={actual.resultado == null ? null : textoNota(actual.resultado)} sinDato="Sin resultado" />
              </Dato>
              <Dato titulo="Estado documental">
                <EtiquetaConIcono tono={doc.tono} icono={<Icono nombre={doc.icono} className="size-3.5" />}>
                  {doc.texto}
                </EtiquetaConIcono>
              </Dato>
              <Dato titulo="Cumplimiento">
                <Valor valor={textoCumplimiento(actual.cumplimiento_documental)} sinDato="Sin dato de cumplimiento" />
              </Dato>
            </dl>

            {cambios && cambios.length > 0 && (
              <MensajeAviso>
                {fila.en_lista ? 'Cambió desde que se confirmó la lista' : 'Cambió desde la versión de su decisión'}:{' '}
                {cambios.map(textoCambio).join(' y ')}.
              </MensajeAviso>
            )}
            {(!cambios || cambios.length === 0) && motivo && <MensajeAviso>{motivo}</MensajeAviso>}
            {cambios && cambios.length === 0 && !motivo && base && (base.posicion != null || base.resultado != null) && (
              <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Coincide con {confirmada ? 'lo confirmado' : 'la versión de su decisión'}.</p>
            )}
            {!actual.listo && (
              <MensajeAviso>Ya no está listo para el ranking: no cumple la habilitación o le faltan notas.</MensajeAviso>
            )}
          </>
        ) : (
          <MensajeAviso>
            Su postulación ya no está activa, así que no hay situación de hoy ni desglose de notas. Solo quedan los datos
            registrados en la lista y en su decisión.
          </MensajeAviso>
        )}
      </section>

      {actual && (
        <section className="flex flex-col gap-3" aria-label="Notas y ponderaciones de hoy">
          <div>
            <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Notas y ponderaciones de hoy</h3>
            {!sinActividades && (
              <p className={`text-xs ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_SUAVE}`}>
                Son las notas vigentes ahora, no una copia de las que había al confirmar la lista. El historial de
                correcciones dice qué cambió y cuándo.
              </p>
            )}
          </div>
          <PanelCalificaciones convocatoriaId={convocatoriaId} postulacionId={fila.postulacion_id} puedeDecidir={puedeDecidir} soloLectura />
        </section>
      )}
    </div>
  )
}
