import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listaEvaluaciones } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import AvatarIniciales from '../../components/evaluacion/AvatarIniciales'
import BadgeEstado from '../../components/evaluacion/BadgeEstado'
import BarraProgreso from '../../components/evaluacion/BarraProgreso'
import { IconoX } from '../../components/convocatorias/Iconos'
import Boton from '../../components/ui/Boton'

const CLASE_INPUT =
  'rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto'

export default function EvaluacionListado() {
  const [filas, setFilas] = useState([])
  const [convocatorias, setConvocatorias] = useState([])
  const [fichas, setFichas] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  const [termino, setTermino] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroConvocatoria, setFiltroConvocatoria] = useState('')
  const [filtroFicha, setFiltroFicha] = useState('')
  const [pagina, setPagina] = useState(1)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Cambia cada cierto tiempo para volver a consultar el avance de los
  // evaluadores sin que el instructor/super admin recargue la página.
  const [refresco, setRefresco] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(termino)
      setPagina(1)
    }, 300)
    return () => clearTimeout(t)
  }, [termino])

  useEffect(() => {
    const actualizar = () => {
      if (document.visibilityState === 'visible') setRefresco((n) => n + 1)
    }
    const intervalo = setInterval(actualizar, 10000)
    document.addEventListener('visibilitychange', actualizar)
    window.addEventListener('focus', actualizar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', actualizar)
      window.removeEventListener('focus', actualizar)
    }
  }, [])

  useEffect(() => {
    listaEvaluaciones({
      page: pagina,
      search: busqueda || undefined,
      convocatoria_id: filtroConvocatoria || undefined,
      ficha_id: filtroFicha || undefined,
    })
      .then((res) => {
        setFilas(res.data)
        setMeta(res.meta)
        if (Array.isArray(res.meta?.convocatorias)) setConvocatorias(res.meta.convocatorias)
        if (Array.isArray(res.meta?.fichas)) setFichas(res.meta.fichas)
        setError('')
      })
      .catch((e) => setError(mensajeError(e)))
      .finally(() => setCargando(false))
  }, [pagina, busqueda, filtroConvocatoria, filtroFicha, refresco])

  const hayFiltros = Boolean(termino || filtroFicha || filtroConvocatoria)

  const limpiarFiltros = () => {
    setTermino('')
    setBusqueda('')
    setFiltroFicha('')
    setFiltroConvocatoria('')
    setPagina(1)
  }

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
            value={filtroFicha}
            onChange={(e) => {
              setFiltroFicha(e.target.value)
              setPagina(1)
            }}
            className={CLASE_INPUT}
          >
            <option value="">Todas las fichas</option>
            {fichas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.codigo}
                {f.nombre_programa ? ` · ${f.nombre_programa}` : ''}
              </option>
            ))}
          </select>

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

          {hayFiltros && (
            <Boton variante="fantasma" tamano="sm" onClick={limpiarFiltros}>
              <IconoX className="h-4 w-4" />
              Limpiar filtros
            </Boton>
          )}
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
              <th className="p-3">Cumplimiento</th>
              <th className="p-3">Evaluación</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-sena-borde">
            {cargando && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  Cargando aspirantes...
                </td>
              </tr>
            )}

            {!cargando && filas.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  No hay aspirantes que coincidan con los filtros.
                </td>
              </tr>
            )}

            {!cargando &&
              filas.map((fila) => {
                const docs = fila.documentos ?? { total: 0, cargados: 0 }
                const colorBarra =
                  docs.total === 0
                    ? 'bg-slate-300'
                    : docs.cargados === docs.total
                      ? 'bg-green-500'
                      : docs.cargados > 0
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
                          valor={docs.cargados}
                          max={docs.total || 1}
                          color={colorBarra}
                          valorTexto={`${docs.cargados}/${docs.total}`}
                        />
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 dark:text-sena-texto">
                        {fila.evaluacion?.cumplimiento != null ? `${fila.evaluacion.cumplimiento}%` : '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      {fila.evaluacion ? (
                        <BadgeEstado
                          estado={
                            fila.evaluacion.estado === 'finalizada'
                              ? 'Completada'
                              : fila.evaluacion.estado === 'correccion_solicitada'
                                ? (fila.evaluacion.documentos_actualizados?.length ?? 0) > 0
                                  ? 'Corregido por revisar'
                                  : 'En corrección'
                                : 'Pendiente'
                          }
                        />
                      ) : (
                        <BadgeEstado estado="Pendiente" />
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
