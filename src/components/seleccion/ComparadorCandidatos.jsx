import { useComparadorCandidatos } from './useComparadorCandidatos'

import { IconoX } from '../convocatorias/Iconos'
import Boton from '../ui/Boton'
import Dialogo from '../ui/Dialogo'
import { MensajeAviso, MensajeError } from '../ui/Mensaje'
import { EsqueletoTarjetas } from '../ui/Esqueleto'
import { CLASE_META_DT, CLASE_TARJETA_PLANA, CLASE_TBODY, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE, CLASE_THEAD } from '../../lib/estilos'

export default function ComparadorCandidatos({ convocatoriaId, ids, onCerrar }) {
  const ctx = useComparadorCandidatos({ convocatoriaId, ids, onCerrar })
  const { candidatos, error, fase, filas, idTitulo, meta, reintentar } = ctx
  return (
    <Dialogo idTitulo={idTitulo} onCerrar={onCerrar} className="max-w-6xl">
      <div className="@container flex flex-col gap-4 p-4 sm:p-6" aria-busy={fase === 'cargando'}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={idTitulo} className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>
              Comparar candidatos
            </h2>
            <p className={`mt-0.5 text-sm ${CLASE_TEXTO_SUAVE}`}>
              {ids.length} candidatos · solo lectura: no cambia la lista ni las decisiones
            </p>
          </div>
          <Boton variante="fantasma" onClick={onCerrar} aria-label="Cerrar la comparación">
            <IconoX className="size-5" />
          </Boton>
        </header>

        {fase === 'cargando' && (
          <EsqueletoTarjetas texto="Cargando la comparación…" n={Math.min(Math.max(ids.length, 2), 3)} />
        )}

        {fase === 'error' && (
          <div className="flex flex-col items-start gap-3">
            <MensajeError>{error}</MensajeError>
            <Boton variante="contorno" onClick={reintentar}>
              Reintentar
            </Boton>
          </div>
        )}

        {fase === 'listo' && (
          <>
            {meta.modo !== 'con_actividades' && (
              <MensajeAviso>
                {meta.modo === 'sin_actividades'
                  ? 'Convocatoria sin actividades: el ranking no tiene puesto ni resultado numérico. La comparación se apoya en la habilitación documental.'
                  : 'La convocatoria aún no tiene configuradas sus actividades, así que el ranking no tiene puesto ni resultado.'}
              </MensajeAviso>
            )}
            {meta.lista?.requiere_revision && (
              <MensajeAviso>
                La lista confirmada (versión {meta.lista.version}) requiere revisión: lo confirmado y lo de hoy pueden diferir.
              </MensajeAviso>
            )}

            {/* Escritorio: criterios en filas y candidatos en columnas. */}
            <div className={`${CLASE_TARJETA_PLANA} hidden overflow-x-auto @min-[960px]:block`}>
              <table className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">Comparación lado a lado de {candidatos.length} candidatos</caption>
                <colgroup>
                  <col className="w-44" />
                  {candidatos.map((c) => (
                    <col key={c.postulacion_id} />
                  ))}
                </colgroup>
                <thead className={CLASE_THEAD}>
                  <tr>
                    <th scope="col" className="px-3 py-2.5 first:pl-4">
                      Criterio
                    </th>
                    {candidatos.map((c) => (
                      <th key={c.postulacion_id} scope="col" className="px-3 py-2.5 align-bottom text-sm normal-case tracking-normal last:pr-4">
                        <span title={c.aspirante} className={`line-clamp-2 ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                          {c.aspirante}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={CLASE_TBODY}>
                  {filas.map((f) => (
                    <tr key={f.id}>
                      <th scope="row" className="px-3 py-3 pl-4 align-top font-medium">
                        <span className={CLASE_TEXTO_FUERTE}>{f.etiqueta}</span>
                        {f.ayuda && <span className={`mt-0.5 block text-xs font-normal ${CLASE_TEXTO_SUAVE}`}>{f.ayuda}</span>}
                      </th>
                      {candidatos.map((c) => (
                        <td key={c.postulacion_id} className="px-3 py-3 align-top last:pr-4">
                          {f.celda(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil y anchos estrechos: una tarjeta por candidato con los mismos criterios, en el mismo orden. */}
            <ul className="flex flex-col gap-3 @min-[960px]:hidden">
              {candidatos.map((c) => (
                <li key={c.postulacion_id} className={`${CLASE_TARJETA_PLANA} flex flex-col gap-3 p-4`}>
                  <h3 className={`text-base font-semibold ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{c.aspirante}</h3>
                  <dl className="flex flex-col gap-3">
                    {filas.map((f) => (
                      <div key={f.id} className="flex flex-col gap-1">
                        <dt className={CLASE_META_DT}>{f.etiqueta}</dt>
                        <dd className="text-sm">{f.celda(c)}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Dialogo>
  )
}
