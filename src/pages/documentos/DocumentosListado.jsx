import { useState, useEffect, useCallback } from 'react'
import { listaFichas } from '../../api/fichas'
import { listaAspirantes } from '../../api/portafolios'
import Mensaje from '../../components/ui/Mensaje'
import Boton from '../../components/ui/Boton'
import Tarjeta from '../../components/ui/Tarjeta'
import Campo from '../../components/ui/Campo'
import Paginacion from '../../components/ui/Paginacion'
import { EsqueletoTabla } from '../../components/ui/Esqueleto'
import useDebounce from '../../lib/useDebounce'
import CampoBusqueda from '../../components/ui/CampoBusqueda'
import EstadoVacio from '../../components/ui/EstadoVacio'
import { Link } from 'react-router-dom'
import { CLASE_CAMPO, CLASE_FILA, CLASE_TABLA, CLASE_TBODY, CLASE_TD, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE, CLASE_TH, CLASE_THEAD, CLASE_TITULO_PAGINA } from '../../lib/estilos'

export default function DocumentosListado() {
  const [fichas, setFichas] = useState([])
  const [fichaId, setFichaId] = useState('')
  const [busqueda, setBusqueda] = useState('')
  // La búsqueda pide al servidor solo cuando el usuario deja de escribir (no en cada tecla).
  const busquedaDiferida = useDebounce(busqueda, 300)
  const [, setPagina] = useState(1)
  const [aspirantes, setAspirantes] = useState([])
  const [meta, setMeta] = useState({})
  const [cargando, setCargando] = useState(true)
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
      if (busquedaDiferida.trim()) params.search = busquedaDiferida.trim()

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
  }, [fichaId, busquedaDiferida])

  useEffect(() => {
    cargarFichas()
  }, [cargarFichas])

  // cargarAspirantes cambia exactamente cuando cambian la ficha o la búsqueda diferida.
  useEffect(() => {
    cargarAspirantes(1)
  }, [cargarAspirantes])

  const cambiarPagina = (nueva) => {
    if (nueva < 1 || nueva > (meta?.last_page ?? 1)) return
    cargarAspirantes(nueva)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <h1 className={CLASE_TITULO_PAGINA}>Portafolios Documentales</h1>
        {/* El total solo se dice cuando se conoce: durante la carga inicial no se muestra «0 aspirante(s)». */}
        {meta?.total != null && <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{meta.total} aspirante(s) con postulaciones</p>}
      </header>

      {/* Mismo bloque de filtros de Convocatorias y Usuarios: campos con etiqueta sobre el lienzo, sin tarjeta gris. */}
      <div role="search" aria-label="Filtrar portafolios" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Campo etiqueta="Buscar por nombre o correo" className="sm:flex-1">
          <CampoBusqueda
            placeholder="Escribe para buscar…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Ficha" className="sm:w-72 sm:shrink-0">
          <select
            value={fichaId}
            onChange={(e) => {
              setFichaId(e.target.value)
              setPagina(1)
            }}
            className={CLASE_CAMPO}
          >
            <option value="">Todas las fichas</option>
            {fichas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.codigo} · {f.nombre_programa}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      {error && <Mensaje tipo="error">{error}</Mensaje>}

      {/* Esqueleto solo en la carga inicial; al filtrar o paginar se conservan las filas (atenuadas) mientras llegan las nuevas. */}
      {cargando && aspirantes.length === 0 ? (
        <EsqueletoTabla
          texto="Cargando aspirantes…"
          filas={5}
          encabezados={[
            { texto: 'Aspirante' },
            { texto: 'Ficha', clase: 'hidden @min-[640px]:block' },
            { texto: 'Postulaciones', clase: 'hidden @min-[640px]:block' },
            { texto: 'Última actividad', clase: 'hidden @min-[640px]:block' },
            { texto: 'Acciones', clase: 'text-center' },
          ]}
          plantilla="grid-cols-[minmax(0,1fr)_9rem] @min-[640px]:grid-cols-[minmax(0,2fr)_6rem_8rem_9rem_9rem]"
          pie
          textoPie="Cargando aspirantes…"
        />
      ) : aspirantes.length === 0 ? (
        <EstadoVacio
          icono="📂"
          titulo="Sin aspirantes"
          descripcion="No hay aspirantes con postulaciones en los filtros actuales."
        />
      ) : (
        <Tarjeta className={`overflow-x-auto ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          <table className={`${CLASE_TABLA} min-w-175`}>
            <thead className={CLASE_THEAD}>
              <tr>
                <th className={CLASE_TH}>Aspirante</th>
                <th className={CLASE_TH}>Ficha</th>
                <th className={CLASE_TH}>Postulaciones</th>
                <th className={CLASE_TH}>Última actividad</th>
                <th className={`${CLASE_TH} text-center`}>Acciones</th>
              </tr>
            </thead>
            <tbody className={CLASE_TBODY}>
              {aspirantes.map((a) => (
                <tr key={a.id} className={CLASE_FILA}>
                  <td className={CLASE_TD}>
                    <div className={`font-semibold ${CLASE_TEXTO_FUERTE}`}>{a.name}</div>
                    <div className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{a.email}</div>
                  </td>
                  <td className={`${CLASE_TD} ${CLASE_TEXTO_FUERTE}`}>{a.ficha ? a.ficha.codigo : '—'}</td>
                  <td className={`${CLASE_TD} ${CLASE_TEXTO_FUERTE}`}>{a.postulaciones_count}</td>
                  <td className={`${CLASE_TD} ${CLASE_TEXTO_SUAVE}`}>
                    {a.updated_at ? new Date(a.updated_at).toLocaleDateString('es-CO') : '—'}
                  </td>
                  <td className={`${CLASE_TD} text-center`}>
                    {/* Misma acción de fila que «Ver detalle» en Preselección: botón con contorno, sin relleno. */}
                    <Boton
                      as={Link}
                      to={`/documentos/${a.id}`}
                      variante="contorno"
                      tamano="tactil"
                      aria-label={`Ver el portafolio de ${a.name}`}
                    >
                      Ver portafolio
                    </Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}

      {meta && aspirantes.length > 0 && (
        <Paginacion
          meta={meta}
          singular="aspirante"
          plural="aspirantes"
          etiqueta="Paginación de portafolios"
          ocupado={cargando}
          onPagina={cambiarPagina}
          className="px-1"
        />
      )}
    </div>
  )
}
