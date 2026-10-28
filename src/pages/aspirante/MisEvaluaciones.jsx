import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { misEvaluaciones } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import client from '../../api/client'
import AvatarIniciales from '../../components/evaluacion/AvatarIniciales'
import BadgeEstado from '../../components/evaluacion/BadgeEstado'

export default function MisEvaluaciones() {
  const { can } = useAuth()
  const [evaluaciones, setEvaluaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [docsDetalle, setDocsDetalle] = useState([])
  const [cargandoDocs, setCargandoDocs] = useState(false)

  const verDetalle = async (e) => {
    setDetalle(e)
    setDocsDetalle([])
    if (!e?.postulacion_id) return
    setCargandoDocs(true)
    const url = can('documentos:ver')
      ? `/revision/postulaciones/${e.postulacion_id}/documentos`
      : `/postulaciones/${e.postulacion_id}/documentos`
    try {
      const res = await client.get(url)
      const payload = res.data?.data ?? res.data ?? {}
      const docs = payload.documentos ?? []
      setDocsDetalle(
        docs
          .filter((d) => d.parametro?.nombre)
          .map((d) => ({
            nombre: d.parametro.nombre,
            estado:
              d.estado === 'subido'
                ? 'Validado'
                : d.estado === 'no_aplica'
                  ? 'No aplica'
                  : 'Pendiente',
          })),
      )
    } catch {
      setDocsDetalle([])
    } finally {
      setCargandoDocs(false)
    }
  }

  useEffect(() => {
    let vivo = true

    misEvaluaciones()
      .then((res) => {
        if (vivo) setEvaluaciones(res.data)
      })
      .catch((e) => {
        if (vivo) setError(mensajeError(e))
      })
      .finally(() => {
        if (vivo) setCargando(false)
      })

    return () => {
      vivo = false
    }
  }, [])

  const nombreAspirante = (e) =>
    typeof e.aspirante === 'string' ? e.aspirante : (e.aspirante?.name ?? '—')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">Mis evaluaciones</h1>

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-sena-borde dark:bg-sena-superficie">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-sena-borde dark:text-sena-texto-suave">
            <tr>
              <th className="p-3">Aspirante</th>
              <th className="p-3">Convocatoria</th>
              <th className="p-3">Puntaje</th>
              <th className="p-3">Evaluación</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-sena-borde">
            {cargando && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  Cargando evaluaciones...
                </td>
              </tr>
            )}

            {!cargando && evaluaciones.length === 0 && !error && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  Aún no tienes evaluaciones registradas.
                </td>
              </tr>
            )}

            {!cargando &&
              evaluaciones.map((e) => (
                <tr key={e.id} className="hover:bg-sena-cielo/20 dark:hover:bg-sena-superficie-alta/20">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <AvatarIniciales nombre={nombreAspirante(e)} size="sm" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-sena-texto">
                          {nombreAspirante(e)}
                        </div>
                        {e.evaluador && e.es_propia === false && (
                          <div className="text-xs text-slate-500 dark:text-sena-texto-suave">
                            Evaluador: {e.evaluador}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-700 dark:text-sena-texto">{e.convocatoria?.titulo ?? '—'}</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800 dark:text-sena-texto">
                      {e.puntaje_total ?? '—'}
                    </span>
                  </td>
                  <td className="p-3">
                    <BadgeEstado estado={e.estado === 'finalizada' ? 'Completada' : 'Pendiente'} />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => verDetalle(e)}
                      className="inline-flex items-center justify-center rounded bg-sena-azul px-2 py-1 text-white transition-colors hover:bg-sena-azul/90"
                      aria-label="Ver evaluación"
                      title="Ver evaluación"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" strokeWidth={2} />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Modal de detalle (solo lectura) */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-sena-superficie">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-sena-texto">
                  {nombreAspirante(detalle)}
                </h2>
                <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
                  {detalle.convocatoria?.titulo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-sena-superficie-alta"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-sena-texto-suave">Puntaje total</span>
                <span className="font-bold text-slate-800 dark:text-sena-texto">{detalle.puntaje_total ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-sena-texto-suave">Cumplimiento</span>
                <span className="font-medium text-slate-800 dark:text-sena-texto">{detalle.cumplimiento ?? 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-sena-texto-suave">Pasa a selección</span>
                <span className={`font-medium ${detalle.pasa_seleccion ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {detalle.pasa_seleccion ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-sena-texto-suave">Estado</span>
                <span className="font-medium text-slate-800 dark:text-sena-texto">
                  {detalle.estado === 'finalizada' ? 'Finalizada' : 'En proceso'}
                </span>
              </div>

              {detalle.fecha && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-sena-texto-suave">Fecha de evaluación</span>
                  <span className="font-medium text-slate-800 dark:text-sena-texto">{detalle.fecha}</span>
                </div>
              )}

              {/* Documentos (solo lectura) */}
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
                  Documentos
                </p>
                {cargandoDocs ? (
                  <p className="text-xs text-slate-500 dark:text-sena-texto-suave">Cargando documentos...</p>
                ) : docsDetalle.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-sena-texto-suave">Sin documentos.</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {docsDetalle.map((d, i) => (
                      <li key={i} className="flex justify-between text-slate-700 dark:text-sena-texto">
                        <span>{d.nombre}</span>
                        <span className="font-medium">{d.estado}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {detalle.criterios?.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
                    Criterios
                  </p>
                  <ul className="flex flex-col gap-1">
                    {detalle.criterios.map((c, i) => (
                      <li key={i} className="flex justify-between text-slate-700 dark:text-sena-texto">
                        <span>{c.criterio}</span>
                        <span className="font-medium">{c.puntaje}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detalle.observaciones && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
                    Observaciones
                  </p>
                  <p className="rounded bg-slate-50 p-2 text-slate-600 dark:bg-sena-noche dark:text-sena-texto-suave">
                    {detalle.observaciones}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setDetalle(null)}
              className="mt-4 w-full rounded bg-sena-oscuro px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-azul"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
