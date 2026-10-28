import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listaEvaluaciones } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import AvatarIniciales from '../../components/evaluacion/AvatarIniciales'
import BadgeEstado from '../../components/evaluacion/BadgeEstado'
import BarraProgreso from '../../components/evaluacion/BarraProgreso'

const CLASE_INPUT =
  'rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto'

export default function EvaluacionListado() {
  const [filas, setFilas] = useState([])
  const [convocatorias, setConvocatorias] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  const [termino, setTermino] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroConvocatoria, setFiltroConvocatoria] = useState('')
  const [pagina, setPagina] = useState(1)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(termino)
      setPagina(1)
    }, 300)
    return () => clearTimeout(t)
  }, [termino])

  useEffect(() => {
    listaEvaluaciones({
      page: pagina,
      search: busqueda || undefined,
      convocatoria_id: filtroConvocatoria || undefined,
    })
      .then((res) => {
        setFilas(res.data)
        setMeta(res.meta)
        if (Array.isArray(res.meta?.convocatorias)) setConvocatorias(res.meta.convocatorias)
        setError('')
      })
      .catch((e) => setError(mensajeError(e)))
      .finally(() => setCargando(false))
  }, [pagina, busqueda, filtroConvocatoria])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">Evaluación: aspirantes</h1>

        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar aspirante..."
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            className={CLASE_INPUT + ' min-w-56'}
          />

          <select
            value={filtroConvocatoria}
            onChange={(e) => {
              setFiltroConvocatoria(e.target.value)
              setPagina(1)
            }}
            className={CLASE_INPUT}
          >
            <option value="">Todas las convocatorias</option>
            {convocatorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-sena-borde dark:bg-sena-superficie">
        <table className="w-full min-w-230 text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-sena-borde dark:text-sena-texto-suave">
            <tr>
              <th className="p-3">Aspirante</th>
              <th className="p-3">Convocatoria</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Portafolio docs.</th>
              <th className="p-3">Puntaje</th>
              <th className="p-3">Evaluación</th>
              <th className="p-3">Resultado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-sena-borde">
            {cargando && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  Cargando aspirantes...
                </td>
              </tr>
            )}

            {!cargando && filas.length === 0 && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  No hay aspirantes que coincidan con los filtros.
                </td>
              </tr>
            )}

            {!cargando &&
              filas.map((fila) => {
                const docs = fila.documentos ?? { total: 0, validados: 0 }
                const colorBarra =
                  docs.total === 0
                    ? 'bg-slate-300'
                    : docs.validados === docs.total
                      ? 'bg-green-500'
                      : docs.validados > 0
                        ? 'bg-orange-500'
                        : 'bg-slate-400'
                return (
                  <tr key={fila.id} className="hover:bg-sena-cielo/20 dark:hover:bg-sena-superficie-alta/20">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <AvatarIniciales nombre={fila.aspirante.name} size="sm" />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-sena-texto">{fila.aspirante.name}</div>
                          <div className="text-xs text-slate-500 dark:text-sena-texto-suave">{fila.aspirante.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-sena-texto">{fila.convocatoria.titulo}</td>
                    <td className="p-3">
                      <BadgeEstado estado={fila.estado === 'postulado' ? 'Postulado' : fila.estado} />
                    </td>
                    <td className="p-3">
                      <div className="flex min-w-24 flex-col gap-1">
                        <BarraProgreso
                          valor={docs.validados}
                          max={docs.total || 1}
                          color={colorBarra}
                          valorTexto={`${docs.validados}/${docs.total}`}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 dark:text-sena-texto">
                        {fila.evaluacion?.puntaje_total ?? '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      {fila.evaluacion ? (
                        <BadgeEstado estado={fila.evaluacion.estado === 'finalizada' ? 'Completada' : 'Pendiente'} />
                      ) : (
                        <BadgeEstado estado="Pendiente" />
                      )}
                    </td>
                    <td className="p-3">
                      {fila.evaluacion?.estado === 'finalizada' ? (
                        fila.evaluacion.pasa_seleccion ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                            Pasa a selección
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                            No pasa
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-sena-texto-suave">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to={`/evaluacion/evaluar/${fila.id}`}
                        className="inline-flex items-center gap-1 rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
                      >
                        Revisar
                      </Link>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-sena-texto-suave">
        <span>
          Página {meta.current_page} de {Math.max(meta.last_page, 1)} · {meta.total} aspirante(s)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={meta.current_page <= 1}
            className="rounded border border-sena-azul/25 px-3 py-1.5 font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
          >
            Anterior
          </button>
          <button
            onClick={() => setPagina((p) => Math.min(meta.last_page, p + 1))}
            disabled={meta.current_page >= meta.last_page}
            className="rounded border border-sena-azul/25 px-3 py-1.5 font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
