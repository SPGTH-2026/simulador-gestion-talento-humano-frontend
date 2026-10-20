import { useState, useEffect, useCallback } from 'react'
import { listaFichas } from '../../api/usuarios'
import { listaAspirantes } from '../../api/portafolios'
import Mensaje from '../../components/ui/Mensaje'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Cargando from '../../components/ui/Cargando'
import EstadoVacio from '../../components/ui/EstadoVacio'
import { Link } from 'react-router-dom'

export default function DocumentosListado() {
  const [fichas, setFichas] = useState([])
  const [fichaId, setFichaId] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [aspirantes, setAspirantes] = useState([])
  const [meta, setMeta] = useState({})
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const cargarFichas = useCallback(async () => {
    try {
      const data = await listaFichas()
      setFichas(data.data)
    } catch {
      // silencioso
    }
  }, [])

  const cargarAspirantes = useCallback(async (page = 1) => {
    setCargando(true)
    setError('')
    try {
      const params = { page }
      if (fichaId) params.ficha_id = fichaId
      if (busqueda.trim()) params.search = busqueda.trim()

      const data = await listaAspirantes(params)
      setAspirantes(data.data)
      setMeta(data.meta)
      setPagina(data.meta?.current_page ?? 1)
    } catch (e) {
      setError('No se pudo cargar el listado de aspirantes.')
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [fichaId, busqueda])

  useEffect(() => {
    cargarFichas()
  }, [])

  useEffect(() => {
    cargarAspirantes(1)
  }, [fichaId, busqueda])

  const cambiarPagina = (nueva) => {
    if (nueva < 1 || nueva > (meta?.last_page ?? 1)) return
    cargarAspirantes(nueva)
  }

  const aspirantesConPostulaciones = useMemo(() =>
    aspirantes.filter(a => a.postulaciones_count > 0), [aspirantes])

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portafolios Documentales</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {meta?.total ?? 0} aspirante(s) con postulaciones
        </p>
      </header>

      <section className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <Campo
          label="Buscar"
          placeholder="Nombre, email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <Campo
          label="Ficha"
          as="select"
          value={fichaId}
          onChange={(e) => { setFichaId(e.target.value); setPagina(1); }}
          className="w-full sm:w-64"
        >
          <option value="">Todas las fichas</option>
          {fichas.map(f => (
            <option key={f.id} value={f.id}>{f.codigo} - {f.nombre_programa}</option>
          ))}
        </Campo>
      </section>

      {error && <Mensaje tipo="error">{error}</Mensaje>}

      {cargando ? (
        <Cargando mensaje="Cargando aspirantes..." />
      ) : aspirantesConPostulaciones.length === 0 ? (
        <EstadoVacio
          icono="📂"
          titulo="Sin aspirantes"
          descripcion="No hay aspirantes con postulaciones en los filtros actuales."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="pb-2 pr-4">Aspirante</th>
                <th className="pb-2 pr-4">Ficha</th>
                <th className="pb-2 pr-4">Postulaciones</th>
                <th className="pb-2 pr-4">Última actividad</th>
                <th className="pb-2">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {aspirantesConPostulaciones.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-slate-900 dark:text-white">{a.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{a.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {a.ficha ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sena-azul/10 text-sena-azul dark:bg-sena-azul/20 dark:text-sena-azul">
                        {a.ficha.codigo}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sin ficha</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                    {a.postulaciones_count}
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-500 dark:text-slate-400">
                    {a.updated_at ? new Date(a.updated_at).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className="py-3">
                    <Link
                      to={`/documentos/${a.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors"
                    >
                      Ver portafolio
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta?.last_page > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Paginación">
          <Boton
            variant="outline"
            size="sm"
            onClick={() => cambiarPagina(pagina - 1)}
            disabled={pagina <= 1}
          >
            Anterior
          </Boton>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Página {pagina} de {meta?.last_page}
          </span>
          <Boton
            variant="outline"
            size="sm"
            onClick={() => cambiarPagina(pagina + 1)}
            disabled={pagina >= (meta?.last_page ?? 1)}
          >
            Siguiente
          </Boton>
        </nav>
      )}
    </div>
  )
}