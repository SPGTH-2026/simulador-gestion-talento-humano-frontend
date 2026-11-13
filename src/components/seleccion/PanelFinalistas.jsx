import { useEffect, useRef, useState } from 'react'
import { finalistasConvocatoria } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import AvatarIniciales from '../evaluacion/AvatarIniciales'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { MensajeAviso, MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import Paginacion from '../ui/Paginacion'
import {
  CLASE_CAJA_SUAVE,
  CLASE_TARJETA_PLANA,
  CLASE_TBODY,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_THEAD,
} from '../../lib/estilos'
import { MOTIVO_REVISION, formatoFechaHora, textoNota } from '../../lib/seleccion'

const CLASE_TH = 'px-3 py-2.5 first:pl-4 last:pr-4'
const CLASE_TD = 'px-3 py-2.5 align-middle first:pl-4 last:pr-4'

const MODO = {
  con_actividades: 'Con actividades',
  sin_actividades: 'Sin actividades',
  pendiente_de_configurar: 'Sin configurar',
}

// Lista de finalistas vigente (la última versión confirmada) y su historial paginado. La lista vigente se
// pide en cada página del historial, pero no depende de ella.
// 'activo': la pestaña está a la vista. Los datos se piden al abrirla por primera vez y no se repiten al volver, salvo
// que 'invalidacion' haya cambiado (el padre la sube cuando una confirmación o un 409 dejaron la lista desactualizada).
export default function PanelFinalistas({ convocatoriaId, activo = true, invalidacion = 0 }) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ fase: 'cargando', datos: null, meta: null, error: '' })
  const [intento, setIntento] = useState(0)
  const [abierta, setAbierta] = useState(activo)
  if (activo && !abierta) setAbierta(true)
  const cargadoClave = useRef(null)

  useEffect(() => {
    if (!abierta || !activo) return undefined
    const clave = `${pagina}|${intento}|${invalidacion}`
    if (cargadoClave.current === clave) return undefined
    let vigente = true
    finalistasConvocatoria(convocatoriaId, { page: pagina })
      .then((res) => {
        if (!vigente) return
        cargadoClave.current = clave
        if (res.meta.current_page !== pagina) setPagina(res.meta.current_page)
        setEstado({ fase: 'listo', datos: res.data, meta: res.meta, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [abierta, activo, convocatoriaId, pagina, intento, invalidacion])

  const { fase, datos, meta, error } = estado
  const cargando = fase === 'cargando'
  const reintentar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }
  const cambiarPagina = (n) => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setPagina(n)
  }

  if (fase === 'error' && !datos) {
    return (
      <div className="flex flex-col items-start gap-3">
        <MensajeError>{error}</MensajeError>
        <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
          Reintentar
        </Boton>
      </div>
    )
  }
  if (!datos) {
    return (
      <p role="status" className={`flex items-center gap-2 py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>
        <Rueda /> Cargando finalistas…
      </p>
    )
  }

  const { actual, versiones } = datos
  const porRevisar = new Map((actual?.revisar ?? []).map((r) => [r.postulacion_id, r.motivo]))
  const conRevision = actual?.requiere_revision === true
  // Con una única versión (la vigente) el historial repetiría la misma lista: solo se muestra si hay algo más.
  const hayHistorial = (meta?.total ?? versiones.length) > 1

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

      {!actual ? (
        <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
          <h3 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no hay finalistas confirmados</h3>
          <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
            Elige a los finalistas en «Ranking» y confírmalos. Cada confirmación queda como una versión de la lista.
          </p>
        </div>
      ) : (
        <section aria-labelledby="titulo-vigente" className={`flex flex-col gap-3 ${cargando ? 'opacity-60' : ''}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 id="titulo-vigente" className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>
              Lista vigente · versión {actual.version}
            </h3>
            <EtiquetaConIcono
              tono={conRevision ? 'aviso' : 'exito'}
              icono={<Icono nombre={conRevision ? 'alerta' : 'check'} className="size-3.5" />}
            >
              {conRevision ? 'Requiere revisión' : 'Vigente'}
            </EtiquetaConIcono>
          </div>

          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
            Confirmada por {actual.confirmada_por ?? 'un usuario'} el {formatoFechaHora(actual.confirmada_en)} ·{' '}
            {MODO[actual.modo] ?? actual.modo} · objetivo <span className="tabular-nums">{actual.objetivo}</span>
          </p>

          {conRevision && (
            <MensajeAviso>
              Desde que se confirmó, cambió algo en {actual.revisar.length === 1 ? 'un finalista' : `${actual.revisar.length} finalistas`}.
              La lista registrada no se modifica: revisa los marcados y confirma una versión nueva desde «Ranking» si corresponde.
            </MensajeAviso>
          )}

          {actual.motivo && (
            <div className={`${CLASE_CAJA_SUAVE} px-3 py-2`}>
              <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                <span className={`font-medium ${CLASE_TEXTO_SUAVE}`}>Justificación: </span>
                {actual.motivo}
              </p>
            </div>
          )}

          <div className={`${CLASE_TARJETA_PLANA} overflow-hidden`}>
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Finalistas de la lista vigente</caption>
              <colgroup>
                <col />
                <col className="w-28 @min-[520px]:w-36" />
                {conRevision && <col className="hidden w-64 @min-[640px]:table-column" />}
              </colgroup>
              <thead className={CLASE_THEAD}>
                <tr>
                  <th scope="col" className={CLASE_TH}>Aspirante</th>
                  <th scope="col" className={`${CLASE_TH} text-right`}>Puesto · resultado</th>
                  {conRevision && (
                    <th scope="col" className={`hidden @min-[640px]:table-cell ${CLASE_TH}`}>Revisión</th>
                  )}
                </tr>
              </thead>
              <tbody className={CLASE_TBODY}>
                {actual.finalistas.map((f) => {
                  const motivo = porRevisar.get(f.postulacion_id)
                  const res = textoNota(f.resultado_adicional)
                  const textoMotivo = motivo ? (MOTIVO_REVISION[motivo] ?? 'Requiere revisión.') : null
                  return (
                    <tr key={f.postulacion_id}>
                      <td className={CLASE_TD}>
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="hidden shrink-0 @min-[520px]:block"><AvatarIniciales nombre={f.aspirante ?? '?'} /></span>
                          <div className="flex min-w-0 flex-col items-start gap-1">
                            <span title={f.aspirante} className={`line-clamp-2 font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                              {f.aspirante}
                            </span>
                            {textoMotivo && (
                              <span className="flex items-start gap-1.5 text-xs font-medium text-aviso @min-[640px]:hidden">
                                <Icono nombre="alerta" className="mt-px size-3.5 shrink-0" />
                                {textoMotivo}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`${CLASE_TD} text-right`}>
                        {f.posicion == null && res == null ? (
                          <span className={CLASE_TEXTO_SUAVE}>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">Sin posición ni nota</span>
                          </span>
                        ) : (
                          <span className={`tabular-nums ${CLASE_TEXTO_FUERTE}`}>
                            <span className="sr-only">Posición </span>
                            <span className="font-semibold">{f.posicion ?? '—'}</span>
                            <span aria-hidden="true" className={CLASE_TEXTO_SUAVE}> · </span>
                            <span className="sr-only">, resultado </span>
                            <span className="font-semibold">{res ?? '—'}</span>
                          </span>
                        )}
                      </td>
                      {conRevision && (
                        <td className={`hidden @min-[640px]:table-cell ${CLASE_TD}`}>
                          {textoMotivo ? (
                            <span className="flex items-start gap-1.5 text-sm font-medium text-aviso">
                              <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
                              {textoMotivo}
                            </span>
                          ) : (
                            <span className={CLASE_TEXTO_SUAVE}>Sin cambios</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hayHistorial && versiones.length > 0 && (
        <section aria-labelledby="titulo-historial" className={`flex flex-col gap-3 ${cargando ? 'opacity-60' : ''}`}>
          <h3 id="titulo-historial" className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>
            Historial de versiones
          </h3>
          <ul className={`${CLASE_TARJETA_PLANA} divide-y divide-sena-linea/70 dark:divide-sena-borde/50`}>
            {versiones.map((v) => (
              <li key={v.version} className="flex flex-col gap-0.5 px-4 py-2.5">
                <p className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
                  Versión <span className="tabular-nums">{v.version}</span> · <span className="tabular-nums">{v.total}</span>{' '}
                  {v.total === 1 ? 'finalista' : 'finalistas'}
                  {actual?.version === v.version && <span className={`font-normal ${CLASE_TEXTO_SUAVE}`}> (vigente)</span>}
                </p>
                <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                  {MODO[v.modo] ?? v.modo} · {v.confirmada_por ?? 'Usuario'} · {formatoFechaHora(v.confirmada_en)}
                </p>
                {v.motivo && <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>«{v.motivo}»</p>}
              </li>
            ))}
          </ul>
          {meta && (
            <Paginacion
              meta={meta}
              singular="versión"
              plural="versiones"
              etiqueta="Paginación del historial"
              ocupado={cargando}
              onPagina={cambiarPagina}
              className="px-1"
            />
          )}
        </section>
      )}
    </div>
  )
}
