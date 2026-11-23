import { usePanelDecisiones } from './usePanelDecisiones'
import { Link } from 'react-router-dom'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import AvatarIniciales from '../evaluacion/AvatarIniciales'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { MensajeAviso, MensajeError, MensajeExito } from '../ui/Mensaje'
import Paginacion from '../ui/Paginacion'
import DialogoDecision from './DialogoDecision'
import DetalleDecision from './DetalleDecision'
import { CLASE_META_DD, CLASE_META_DT, CLASE_TARJETA_PLANA, CLASE_TBODY, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE, CLASE_THEAD } from '../../lib/estilos'
import { ESTADO_DECISION, MOTIVO_REVISION_DECISION, accionesDeFila, formatoFechaHora } from '../../lib/seleccion'

const CLASE_TH = 'px-3 py-2.5 first:pl-4 last:pr-4'
const CLASE_TD = 'px-3 py-2.5 align-middle first:pl-4 last:pr-4'

function EtiquetaDecision({ codigo }) {
  const e = ESTADO_DECISION[codigo] ?? ESTADO_DECISION.pendiente
  return (
    <EtiquetaConIcono tono={e.tono} icono={<Icono nombre={e.icono} className="size-3.5" />}>
      {e.texto}
    </EtiquetaConIcono>
  )
}

// Decisiones de UNA convocatoria: cupos, finalistas de la lista vigente y personas con decisión que ya salieron de ella.
// El padre lo monta con key = id de la convocatoria: al cambiar nace de cero (página 1, sin filas, sin diálogos) y la
// respuesta tardía de la anterior se descarta porque su efecto ya fue limpiado.
// Las acciones de cada fila las calcula accionesDeFila con lo último que dijo el servidor; el servidor sigue validando.
export default function PanelDecisiones({ convocatoriaId, enProceso, puedeDecidir }) {
  const ctx = usePanelDecisiones({ convocatoriaId, enProceso, puedeDecidir })
  const { accionesDe, alConflicto, alGuardar, cambiarPagina, cargando, cupos, detalle, error, fase, filaDecidiendo, filaDetalle, filas, guardada, lista, meta, pausaGuardada, reintentar, setDecidiendo, setDetalle, setGuardada, sinFilas, vigenteEnProceso } = ctx
  return (
    <div className="@container flex flex-col gap-4" aria-busy={cargando}>
      {fase === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      <dl className={`${CLASE_TARJETA_PLANA} grid grid-cols-2 gap-x-5 gap-y-3 p-4 @min-[520px]:grid-cols-4`}>
        <div>
          <dt className={CLASE_META_DT}>Vacantes</dt>
          <dd className={`${CLASE_META_DD} tabular-nums`}>{cupos.vacantes_totales}</dd>
        </div>
        <div>
          <dt className={CLASE_META_DT}>Cupos ocupados</dt>
          <dd className={`${CLASE_META_DD} tabular-nums`}>{cupos.cupos_ocupados}</dd>
        </div>
        <div>
          <dt className={CLASE_META_DT}>Cupos disponibles</dt>
          <dd className={`${CLASE_META_DD} tabular-nums`}>{cupos.cupos_disponibles}</dd>
        </div>
        <div>
          <dt className={CLASE_META_DT}>Pendientes de decisión</dt>
          <dd className={`${CLASE_META_DD} tabular-nums`}>{meta.pendientes}</dd>
        </div>
      </dl>

      {/* Confirmación breve: se retira sola a los pocos segundos (se detiene mientras se lee). La lista, los cupos y la fila
          ya muestran el resultado, así que nada se pierde al desaparecer. */}
      {guardada && (
        <div {...pausaGuardada}>
          <MensajeExito>{guardada.texto}</MensajeExito>
        </div>
      )}

      {lista == null ? (
        <MensajeAviso>
          Aún no hay una lista de finalistas confirmada, así que no hay decisiones por tomar.{' '}
          <Link to={`/seleccion?convocatoria=${convocatoriaId}&pestana=ranking`} className="font-semibold underline underline-offset-2">
            Confirma los finalistas en Ranking
          </Link>
          .
        </MensajeAviso>
      ) : (
        <>
          {lista.requiere_revision && (
            <MensajeAviso>
              La lista de finalistas (versión {lista.version}) requiere revisión. Mientras tanto no se pueden registrar
              decisiones nuevas ni cambiar las que no sean «Seleccionado»; sí se puede liberar un cupo.{' '}
              <Link to={`/seleccion?convocatoria=${convocatoriaId}&pestana=finalistas`} className="font-semibold underline underline-offset-2">
                Ver la lista
              </Link>
              .
            </MensajeAviso>
          )}
          {!lista.requiere_revision && cupos.cupos_disponibles === 0 && meta.pendientes > 0 && (
            <MensajeAviso>
              No quedan cupos disponibles: los finalistas pendientes solo pueden quedar como «No seleccionado» hasta que se libere un
              cupo.
            </MensajeAviso>
          )}
        </>
      )}

      {vigenteEnProceso === false && (
        <MensajeAviso>La convocatoria no está en proceso: las decisiones se pueden consultar, pero no registrar ni cambiar.</MensajeAviso>
      )}

      {sinFilas ? (
        lista != null && (
          <p className={`px-1 py-6 text-center text-sm ${CLASE_TEXTO_SUAVE}`}>Esta lista no tiene finalistas ni decisiones.</p>
        )
      ) : (
        <div className={`${CLASE_TARJETA_PLANA} overflow-hidden ${cargando ? 'opacity-60' : ''}`}>
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Finalistas y decisiones de la convocatoria</caption>
            {/* Aspirante no se queda con todo el ancho sobrante: desde 640 px ocupa un tercio, Decisión recibe el resto y
                Acciones tiene lo justo para sus dos botones en fila (o apilados cuando el panel es más angosto). */}
            <colgroup>
              <col className="@min-[640px]:w-[34%]" />
              <col className="hidden @min-[640px]:table-column" />
              <col className="w-40 @min-[520px]:w-44 @min-[680px]:w-64" />
            </colgroup>
            <thead className={CLASE_THEAD}>
              <tr>
                <th scope="col" className={CLASE_TH}>
                  Aspirante
                </th>
                <th scope="col" className={`hidden @min-[640px]:table-cell ${CLASE_TH}`}>
                  Decisión
                </th>
                <th scope="col" className={`${CLASE_TH} text-right`}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className={CLASE_TBODY}>
              {filas.map((f) => {
                const acciones = accionesDe(f)
                // «Fuera de la lista vigente» ya lo dice la línea de debajo del nombre: no se repite como aviso.
                const motivo = f.requiere_revision && f.motivo_revision !== 'fuera_de_lista' ? (MOTIVO_REVISION_DECISION[f.motivo_revision] ?? 'Requiere revisión.') : null
                return (
                  <tr key={f.postulacion_id}>
                    <td className={CLASE_TD}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="hidden shrink-0 @min-[520px]:block">
                          <AvatarIniciales nombre={f.aspirante ?? '?'} />
                        </span>
                        <div className="flex min-w-0 flex-col items-start gap-1.5">
                          <span title={f.aspirante} className={`line-clamp-2 font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                            {f.aspirante}
                          </span>
                          <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
                            {!f.en_lista ? (
                              'Fuera de la lista vigente'
                            ) : f.posicion == null ? (
                              'Finalista sin posición'
                            ) : (
                              <>
                                Posición <span className="tabular-nums">{f.posicion}</span>
                              </>
                            )}
                          </span>
                          <span className="@min-[640px]:hidden">
                            <EtiquetaDecision codigo={f.estado} />
                          </span>
                          {motivo && (
                            <span className="flex items-start gap-1.5 text-xs font-medium text-aviso">
                              <Icono nombre="alerta" className="mt-px size-3.5 shrink-0" />
                              {motivo}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`hidden align-top @min-[640px]:table-cell ${CLASE_TD}`}>
                      <div className="flex flex-col items-start gap-1">
                        <EtiquetaDecision codigo={f.estado} />
                        {f.decision && (
                          <span className={`text-xs ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_SUAVE}`}>
                            {f.decision.decidida_por ?? 'Un usuario'} · {formatoFechaHora(f.decision.decidida_en)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`${CLASE_TD} text-right`}>
                      <div className="flex flex-col items-end gap-2 @min-[680px]:flex-row @min-[680px]:items-center @min-[680px]:justify-end">
                        {acciones.puede && (
                          <Boton
                            variante="contorno"
                            tamano="tactil"
                            className="w-full @min-[680px]:w-auto"
                            aria-label={
                              acciones.etiqueta === 'Decidir'
                                ? `Decidir sobre ${f.aspirante}`
                                : `${acciones.etiqueta} la decisión de ${f.aspirante}`
                            }
                            onClick={() => {
                              setGuardada(null)
                              setDecidiendo(f.postulacion_id)
                            }}
                          >
                            {acciones.etiqueta}
                          </Boton>
                        )}
                        {/* Misma acción de fila que «Ver detalle» en Preselección: abre la evidencia (y el historial si ya hay decisión). */}
                        <Boton
                          variante="contorno"
                          tamano="tactil"
                          className="w-full @min-[680px]:w-auto"
                          aria-label={`Ver el detalle de ${f.aspirante}`}
                          onClick={() => setDetalle(f.postulacion_id)}
                        >
                          Ver detalle
                        </Boton>
                        {/* Solo se explica en la fila lo que la página no dice ya con un aviso: el permiso. */}
                        {!acciones.puede && !puedeDecidir && acciones.razon && (
                          <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{acciones.razon}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && !sinFilas && (
        <Paginacion
          meta={meta}
          singular="finalista o decisión"
          plural="finalistas y decisiones"
          etiqueta="Paginación de las decisiones"
          ocupado={cargando}
          onPagina={cambiarPagina}
          className="px-1"
        />
      )}

      {filaDecidiendo && (
        <DialogoDecision
          key={filaDecidiendo.postulacion_id}
          convocatoriaId={convocatoriaId}
          fila={filaDecidiendo}
          acciones={accionesDe(filaDecidiendo)}
          cupos={cupos}
          lista={lista}
          onGuardada={alGuardar}
          onConflicto={alConflicto}
          onCerrar={() => setDecidiendo(null)}
        />
      )}
      {filaDetalle && (
        <DetalleDecision
          key={filaDetalle.postulacion_id}
          convocatoriaId={convocatoriaId}
          fila={filaDetalle}
          lista={lista}
          puedeDecidir={puedeDecidir}
          onCerrar={() => setDetalle(null)}
        />
      )}
    </div>
  )
}
