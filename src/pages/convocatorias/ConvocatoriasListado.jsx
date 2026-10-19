import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import {
  listaConvocatorias,
  cambiarEstadoConvocatoria,
  listaParametros,
} from '../../api/convocatorias'
import { listaFichas } from '../../api/usuarios'
import { mensajeError } from '../../api/mensajeError'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import {
  BotonIcono,
  IconoCalendario,
  IconoCandado,
  IconoLapiz,
  IconoLupa,
  IconoMaletin,
  IconoOjo,
  IconoUsuarios,
} from '../../components/convocatorias/Iconos'
import Boton from '../../components/ui/Boton'
import Cargando from '../../components/ui/Cargando'
import EstadoVacio from '../../components/ui/EstadoVacio'
import { MensajeError } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import { CLASE_INPUT } from '../../lib/estilos'

// El candado avanza un paso del ciclo de vida. La etiqueta depende del estado
// actual: desde 'publicada' se cierra la recepción; desde 'en_proceso', la
// convocatoria completa.
const PASOS_CANDADO = {
  publicada: { etiqueta: 'Cerrar recepción', destino: 'en_proceso' },
  en_proceso: { etiqueta: 'Cerrar convocatoria', destino: 'cerrada' },
}

// dd/mm/aaaa. Se corta la cadena ISO 'aaaa-mm-dd' a mano en vez de pasar por
// new Date(): así no hay desfase de zona horaria (un día menos en Colombia).
function formatearFecha(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso
}

// Franja lateral de cada tarjeta, por estado. Reutiliza los mismos tonos que la
// etiqueta de estado: el verde institucional no entra aquí (queda para la
// acción principal); 'publicada' usa el azul institucional.
const FRANJA_ESTADO = {
  borrador: 'bg-slate-400 dark:bg-slate-500',
  publicada: 'bg-sena-azul dark:bg-sena-cielo',
  en_proceso: 'bg-amber-500',
  cerrada: 'bg-red-500',
}

// Cada dato va como etiqueta pequeña con su icono y el valor debajo: sin cajas
// ni relleno extra, la tarjeta queda más baja y rectangular.
const CLASE_META_DT =
  'flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-sena-texto-suave'
const CLASE_META_DD = 'text-xs font-semibold text-slate-700 dark:text-sena-texto'

export default function ConvocatoriasListado() {
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const gestiona = can('convocatorias:gestionar')
  // El filtro por ficha solo lo ve quien puede listar fichas: super admin e
  // instructor ('usuarios:gestionar'). Un gestor de convocatorias sin ese
  // permiso no puede pedir GET /api/fichas y no debe ver el selector.
  const puedeFiltrarFicha = gestiona && can('usuarios:gestionar')
  // El aspirante ve una sola acción por tarjeta: "Ver información" (navega al
  // detalle siempre; el 404 de las no publicadas lo absorbe la vista).
  const esAspirante = user?.role === 'aspirante'

  const [convocatorias, setConvocatorias] = useState([])
  const [fichas, setFichas] = useState([])
  const [opcionesEstado, setOpcionesEstado] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [pagina, setPagina] = useState(1)

  const [termino, setTermino] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFicha, setFiltroFicha] = useState('')
  const [recarga, setRecarga] = useState(0)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [accionandoId, setAccionandoId] = useState(null)

  // El texto se aplaza 300 ms para no martillar el backend letra a letra.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(termino)
      setPagina(1)
    }, 300)
    return () => clearTimeout(t)
  }, [termino])

  // Las opciones del filtro salen del catálogo (tema estado_convocatoria), no
  // del código: así un estado nuevo en el backend aparece sin tocar el front.
  useEffect(() => {
    let activo = true
    listaParametros('estado_convocatoria')
      .then((res) => {
        if (activo) setOpcionesEstado(res.data ?? [])
      })
      .catch(() => {
        if (activo) setOpcionesEstado([])
      })
    return () => {
      activo = false
    }
  }, [])

  // Las fichas del filtro salen del alcance del usuario (GET /api/fichas):
  // un instructor solo ve las suyas; el super admin, todas.
  useEffect(() => {
    if (!puedeFiltrarFicha) return undefined

    let activo = true
    listaFichas()
      .then((res) => {
        if (activo) setFichas(res.data ?? [])
      })
      .catch(() => {
        if (activo) setFichas([])
      })

    return () => {
      activo = false
    }
  }, [puedeFiltrarFicha])

  useEffect(() => {
    const control = new AbortController()

    // En los refetch la lista conserva los datos viejos mientras llegan los
    // nuevos; por eso 'cargando' solo se activa en el montaje.
    listaConvocatorias({
      page: pagina,
      q: busqueda || undefined,
      estado: filtroEstado || undefined,
      ficha_id: filtroFicha || undefined,
    })
      .then((res) => {
        setConvocatorias(res.data)
        setMeta(res.meta)
        setError('')
      })
      .catch((e) => {
        if (e.name !== 'CanceledError') setError(mensajeError(e))
      })
      .finally(() => setCargando(false))

    return () => control.abort()
  }, [pagina, busqueda, filtroEstado, filtroFicha, recarga])

  const avanzarEstado = async (convocatoria, { etiqueta, destino }) => {
    if (!window.confirm(`¿${etiqueta} de "${convocatoria.nombre}"?`)) return

    setAccionandoId(convocatoria.id)
    setError('')

    try {
      await cambiarEstadoConvocatoria(convocatoria.id, { estado: destino })
    } catch (e) {
      // 422 (transición inválida), 403 (sin permiso) y 404 se muestran tal cual.
      setError(mensajeError(e))
    } finally {
      setAccionandoId(null)
      // Tras responder (bien o mal) se relee la lista: la UI refleja el estado
      // real del servidor y no el que creíamos localmente.
      setRecarga((n) => n + 1)
    }
  }

  // Las mismas acciones se usan en todas las tarjetas, para no duplicar la
  // lógica de permisos.
  const renderAcciones = (c) => {
    const paso = PASOS_CANDADO[c.estado?.codigo]
    const editable = c.estado?.codigo === 'borrador' || c.estado?.codigo === 'publicada'

    // El aspirante ve UNA sola acción: "Ver información". Siempre disponible,
    // incluso si la convocatoria ya no está publicada: el detalle absorbe el 404.
    if (esAspirante) {
      return (
        <BotonIcono etiqueta="Ver información" onClick={() => navigate(`/convocatorias/${c.id}`)}>
          <IconoOjo />
        </BotonIcono>
      )
    }

    return (
      <>
        <BotonIcono etiqueta="Ver detalle" onClick={() => navigate(`/convocatorias/${c.id}`)}>
          <IconoOjo />
        </BotonIcono>

        {gestiona && editable && (
          <BotonIcono etiqueta="Editar" onClick={() => navigate(`/convocatorias/${c.id}/editar`)}>
            <IconoLapiz />
          </BotonIcono>
        )}

        {gestiona && paso && (
          <BotonIcono
            etiqueta={paso.etiqueta}
            tono="rojo"
            disabled={accionandoId === c.id}
            onClick={() => avanzarEstado(c, paso)}
          >
            <IconoCandado />
          </BotonIcono>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-sena-texto">Convocatorias</h1>
        <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
          Gestiona y consulta las convocatorias disponibles para los procesos de selección.
        </p>
      </div>

      {/* Barra de herramientas en dos filas: arriba el buscador y la acción
          principal; abajo los selectores agrupados bajo una etiqueta. Así el
          buscador y los filtros nunca se amontonan aunque haya varios. */}
      <Tarjeta className="p-3">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:max-w-sm">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-sena-texto-suave">
                <IconoLupa />
              </span>
              <input
                type="search"
                placeholder="Buscar por nombre, código o cargo..."
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                className={`${CLASE_INPUT} w-full pl-10`}
              />
            </div>

            {gestiona && (
              <Boton className="sm:ml-auto" onClick={() => navigate('/convocatorias/nueva')}>
                + Nueva convocatoria
              </Boton>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-sena-linea/60 pt-2.5 dark:border-sena-borde/50">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-sena-texto-suave">
              Filtrar
            </span>

            {puedeFiltrarFicha && (
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
                    {f.codigo} · {f.nombre_programa}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value)
                setPagina(1)
              }}
              className={CLASE_INPUT}
            >
              <option value="">Todos los estados</option>
              {opcionesEstado.map((o) => (
                <option key={o.codigo} value={o.codigo}>
                  {o.nombre}
                </option>
              ))}
            </select>

            {(termino || filtroFicha || filtroEstado) && (
              <button
                type="button"
                onClick={() => {
                  setTermino('')
                  setFiltroFicha('')
                  setFiltroEstado('')
                  setPagina(1)
                }}
                className="ml-1 text-xs font-medium text-sena-azul underline-offset-2 hover:underline dark:text-sena-texto"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </Tarjeta>

      {error && <MensajeError>{error}</MensajeError>}

      {cargando && (
        <Tarjeta className="p-4">
          <Cargando>Cargando convocatorias...</Cargando>
        </Tarjeta>
      )}

      {!cargando && convocatorias.length === 0 && (
        <Tarjeta className="p-4">
          <EstadoVacio>No hay convocatorias que coincidan con los filtros.</EstadoVacio>
        </Tarjeta>
      )}

      {/* Rejilla de tarjetas: una convocatoria por tarjeta, en todos los anchos. */}
      {!cargando && convocatorias.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {convocatorias.map((c) => (
            <Tarjeta key={c.id} className="relative flex flex-col p-2.5 pl-3">
              {/* Franja de color por estado: refuerza la lectura sin depender
                  solo de la etiqueta. Se redondea a la izquierda para seguir la
                  curva de la tarjeta. */}
              <span
                aria-hidden="true"
                className={`absolute inset-y-0 left-0 w-1.5 rounded-l-2xl ${
                  FRANJA_ESTADO[c.estado?.codigo] ?? 'bg-sena-linea'
                }`}
              />

              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center rounded-md bg-sena-fondo px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-sena-azul dark:bg-sena-noche/50 dark:text-sena-texto-suave">
                  {c.codigo}
                </span>
                <EtiquetaEstado codigo={c.estado?.codigo} nombre={c.estado?.nombre} />
              </div>

              <h3 className="mt-1 text-sm font-semibold leading-snug text-slate-800 dark:text-sena-texto">
                {c.nombre}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-sena-texto-suave">{c.cargo}</p>

              <dl className="my-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {/* PUBLICACIÓN = fecha de apertura (suposición anotada en el documento 05). */}
                <div>
                  <dt className={CLASE_META_DT}>
                    <IconoCalendario className="h-3 w-3" /> Publicación
                  </dt>
                  <dd className={CLASE_META_DD}>{formatearFecha(c.fecha_apertura)}</dd>
                </div>
                <div>
                  <dt className={CLASE_META_DT}>
                    <IconoCalendario className="h-3 w-3" /> Cierre
                  </dt>
                  <dd className={CLASE_META_DD}>{formatearFecha(c.fecha_cierre)}</dd>
                </div>
                <div>
                  <dt className={CLASE_META_DT}>
                    <IconoMaletin className="h-3 w-3" /> Vacantes
                  </dt>
                  <dd className={CLASE_META_DD}>{c.vacantes}</dd>
                </div>
                {gestiona && (
                  <div>
                    <dt className={CLASE_META_DT}>
                      <IconoUsuarios className="h-3 w-3" /> Aspirantes
                    </dt>
                    {/* El backend no envía postulantes al aspirante. */}
                    <dd className="text-xs font-semibold text-sena-azul dark:text-sena-texto">
                      {c.postulantes ?? 0}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-auto flex justify-end gap-1 border-t border-sena-linea/70 pt-1.5 dark:border-sena-borde/60">
                {renderAcciones(c)}
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      <Tarjeta className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm text-slate-600 dark:text-sena-texto-suave">
        <span>
          Página {meta.current_page} de {Math.max(meta.last_page, 1)} · {meta.total} convocatoria(s)
        </span>
        <div className="flex gap-2">
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={meta.current_page <= 1}
          >
            Anterior
          </Boton>
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={() => setPagina((p) => Math.min(meta.last_page, p + 1))}
            disabled={meta.current_page >= meta.last_page}
          >
            Siguiente
          </Boton>
        </div>
      </Tarjeta>
    </div>
  )
}
