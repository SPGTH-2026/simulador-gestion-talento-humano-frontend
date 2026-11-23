import { isValidElement } from 'react'
import { usePanelReferencia } from './usePanelReferencia'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Etiqueta from '../ui/Etiqueta'
import Icono from '../ui/Icono'
import { MensajeAviso, MensajeError, MensajeExito } from '../ui/Mensaje'
import { CLASE_CAJA_SUAVE, CLASE_CAMPO, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { RESULTADO_EVALUACION, formatoFecha, textoCumplimiento } from '../../lib/seleccion'

function EtiquetaResultado({ resultado }) {
  const r = RESULTADO_EVALUACION[resultado] ?? { texto: resultado, tono: 'neutral', icono: 'reloj' }
  return (
    <EtiquetaConIcono tono={r.tono} icono={<Icono nombre={r.icono} className="size-3.5" />}>
      {r.texto}
    </EtiquetaConIcono>
  )
}

// Evaluación de referencia de UN candidato. Solo la ven y la designan el Instructor y el Superadministrador:
// quien la monta decide con 'puedeDesignar' (el backend igual responde 403 a los demás). Se pide la primera
// vez que se abre la pestaña ('activo'), no al abrir el detalle ni por fila.
export default function PanelReferencia({ convocatoriaId, postulacionId, activo, onCambio }) {
  const ctx = usePanelReferencia({ convocatoriaId, postulacionId, activo, onCambio })
  // Sin abrir la pestaña el hook devuelve null; sin datos y con error devuelve el aviso con «Reintentar» (un elemento).
  if (ctx === null || isValidElement(ctx)) return ctx
  const { datos, doc, editarJustificacion, elegida, error, errorGeneral, errores, evaluaciones, fase, guardada, guardando, guardar, idGrupo, invalidada, justificacion, necesita, puedeGuardar, referencia, reintentar, setElegida, setErrores } = ctx
  return (
    <div className="@container flex flex-col gap-4">
      {fase === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <EtiquetaConIcono tono={doc.tono} icono={<Icono nombre={doc.icono} className="size-3.5" />}>
          {doc.texto}
        </EtiquetaConIcono>
        <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
          Cumplimiento mostrado:{' '}
          <span className={`font-semibold tabular-nums ${CLASE_TEXTO_FUERTE}`}>
            {textoCumplimiento(datos.cumplimiento) ?? 'sin dato'}
          </span>
        </p>
      </div>

      {referencia && (
        <section className={`${CLASE_CAJA_SUAVE} flex flex-col gap-2 p-4`} aria-label="Referencia actual">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Referencia actual</h4>
            {referencia.vigente ? (
              <Etiqueta tono="exito">Vigente</Etiqueta>
            ) : (
              <Etiqueta tono="aviso">Invalidada: requiere nueva confirmación</Etiqueta>
            )}
          </div>
          <p className={`flex flex-wrap items-center gap-2 text-sm ${CLASE_TEXTO_FUERTE}`}>
            {referencia.evaluador ?? 'Evaluador eliminado'} ·{' '}
            <span className="font-semibold tabular-nums">{textoCumplimiento(referencia.cumplimiento)}</span>
            <EtiquetaResultado resultado={referencia.resultado} />
          </p>
          <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>“{referencia.justificacion}”</p>
          <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            Designada por {referencia.designada_por ?? 'usuario eliminado'} · {formatoFecha(referencia.designada_en)}
          </p>
          {invalidada && (
            <p className={`text-sm ${CLASE_TEXTO_FUERTE}`}>
              La evaluación elegida cambió después de designarla (se reabrió, se recalculó o se editó). Elige una
              evaluación vigente para confirmar de nuevo.
            </p>
          )}
        </section>
      )}

      {evaluaciones.length === 0 ? (
        <div className="flex flex-col gap-1 py-4">
          <p className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Sin evaluaciones finalizadas</p>
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
            El candidato queda pendiente hasta que un evaluador finalice su evaluación con resultado.
          </p>
        </div>
      ) : (
        <form onSubmit={guardar} noValidate aria-busy={guardando} className="flex flex-col gap-4">
          <fieldset disabled={!necesita || guardando} className="flex min-w-0 flex-col gap-2">
            <legend className={`mb-1 text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
              Evaluaciones finalizadas ({evaluaciones.length})
            </legend>
            {evaluaciones.map((ev) => {
              const marcada = elegida === ev.id
              const esReferencia = referencia?.evaluacion_id === ev.id
              return (
                <label
                  key={ev.id}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 has-disabled:cursor-default has-disabled:opacity-90 has-focus-visible:ring-2 has-focus-visible:ring-sena/40 ${
                    marcada
                      ? 'border-sena bg-sena-fondo ring-1 ring-sena dark:bg-sena-superficie-alta'
                      : 'border-sena-linea/80 dark:border-sena-borde/60'
                  }`}
                >
                  <input
                    type="radio"
                    name={idGrupo}
                    value={ev.id}
                    checked={marcada}
                    onChange={() => {
                      setElegida(ev.id)
                      setErrores((previo) => ({ ...previo, evaluacion_id: undefined }))
                    }}
                    className="mt-1 size-4 shrink-0 accent-sena-oscuro"
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className={`flex flex-wrap items-center gap-2 text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
                      {ev.evaluador ?? 'Evaluador eliminado'}
                      <span className="tabular-nums">{textoCumplimiento(ev.cumplimiento)}</span>
                      <EtiquetaResultado resultado={ev.resultado} />
                      {esReferencia && <Etiqueta tono="azul" className="whitespace-nowrap">Es la referencia</Etiqueta>}
                    </span>
                    <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Actualizada {formatoFecha(ev.actualizada_en)}</span>
                  </span>
                </label>
              )
            })}
            {errores.evaluacion_id && (
              <p role="alert" className="flex items-start gap-1.5 text-sm font-medium text-peligro">
                <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
                {errores.evaluacion_id}
              </p>
            )}
          </fieldset>

          {!necesita ? (
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
              Con un único resultado vigente no hace falta designar una referencia: el resultado es automático.
            </p>
          ) : (
            <>
              <Campo
                etiqueta={invalidada ? 'Justificación de la nueva confirmación' : 'Justificación de la referencia'}
                requerido
                error={errores.justificacion}
                ayuda="Explica por qué esta evaluación es la que vale (de 10 a 500 caracteres)."
              >
                {({ id, describedby, invalid }) => (
                  <textarea
                    id={id}
                    rows={3}
                    maxLength={500}
                    value={justificacion}
                    onChange={editarJustificacion}
                    disabled={guardando}
                    aria-describedby={describedby}
                    aria-invalid={invalid || undefined}
                    className={`${CLASE_CAMPO} py-2`}
                  />
                )}
              </Campo>

              {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}
              {guardada && <MensajeExito>Referencia designada. El estado documental se actualizó.</MensajeExito>}

              <div className="flex flex-wrap items-center gap-3">
                <Boton type="submit" tamano="tactil" ocupado={guardando} disabled={!puedeGuardar}>
                  {guardando ? 'Guardando…' : referencia ? 'Sustituir referencia' : 'Designar como referencia'}
                </Boton>
                {elegida == null && <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Elige una evaluación.</p>}
              </div>
            </>
          )}
          {!necesita && guardada && <MensajeExito>Referencia designada.</MensajeExito>}
        </form>
      )}

      {datos.estado_documental === 'requiere_revision' && !referencia && (
        <MensajeAviso>
          Este candidato tiene varias evaluaciones finalizadas. Mientras no se designe una referencia, queda en
          «Requiere revisión» y no puede calificarse.
        </MensajeAviso>
      )}
    </div>
  )
}
