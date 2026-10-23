import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import {
  listaConvocatorias,
  cambiarEstadoConvocatoria,
  listaParametros,
} from '../../api/convocatorias'
import { listaFichas } from '../../api/fichas'
import { mensajeError } from '../../api/mensajeError'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import {
  IconoCandado,
  IconoFlechaDerecha,
  IconoFlechaIzquierda,
  IconoLapiz,
  IconoLupa,
  IconoMas,
  IconoOjo,
  IconoX,
} from '../../components/convocatorias/Iconos'
import Boton from '../../components/ui/Boton'
import { MensajeError } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import { pasoDeEstado, veIdentificador } from '../../lib/convocatorias'
import { textoCierraPronto } from '../../lib/ventanaPostulacion'
import {
  CLASE_CHIP,
  CLASE_INPUT,
  CLASE_META_DD,
  CLASE_META_DT,
  CLASE_SUBTITULO_PAGINA,
  CLASE_TARJETA_PLANA,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'

// dd/mm/aaaa. Se corta la cadena ISO 'aaaa-mm-dd' a mano en vez de pasar por
// new Date(): así no hay desfase de zona horaria (un día menos en Colombia).
function formatearFecha(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso
}

// Bloques del esqueleto de carga. La animación se apaga si el usuario pidió
// reducir el movimiento.
const CLASE_ESQUELETO =
  'animate-pulse rounded-md bg-sena-hundido motion-reduce:animate-none dark:bg-sena-superficie-alta'

// Botones de acción de la tarjeta. La fila es de UNA SOLA línea (nunca se
// parte en dos). La tarjeta es el contenedor de consultas (@container): cuando
// es angosta (menos de 420 px) se ocultan los iconos y se reduce el relleno
// horizontal, ANTES que tocar el texto. El texto nunca se achica ni se
// recorta: se queda en 12 px.
//
// 'flex-[1_0_auto]': cada botón toma su ancho natural y reparte el sobrante
// (crece), pero NUNCA encoge por debajo de su texto. Con 'flex-1' (que reparte
// a partes iguales) el texto de "Cerrar convocatoria" se salía de su botón.
//
// Medido en el navegador (ancho mínimo de la fila con los tres botones):
//   - con iconos y relleno de 12 px: 356,40 px;
//   - sin iconos y relleno de 8 px: 260,40 px.
// Con la tarjeta más angosta que existe (360 px de pantalla -> 288 px de
// contenido) la fila sin iconos entra; con iconos no cabría.
const CLASE_BOTON_ACCION =
  'min-h-10 flex-[1_0_auto] justify-center px-[8px] @min-[420px]:px-[12px]'

// Icono de la acción: oculto en tarjetas angostas (menos de 420 px).
const CLASE_ICONO_ACCION = 'hidden h-4 w-4 shrink-0 @min-[420px]:block'

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
  // Gestión REAL: permiso + lista blanca (instructor, super admin y el subrol
  // gestor_convocatorias). El aprendiz con subrol 'general' tiene el permiso
  // 'convocatorias:gestionar' pero NO es gestión. Decide dos cosas:
  //  - el identificador (CONV-AAAA-NNN), dato de gestión;
  //  - qué estados ve la lista: las cerradas solo las ve la gestión.
  const gestionaEstricto = veIdentificador(user, can)

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

  const limpiarFiltros = () => {
    setTermino('')
    setFiltroFicha('')
    setFiltroEstado('')
    setPagina(1)
  }

  const hayFiltros = Boolean(termino || filtroFicha || filtroEstado)

  // Las mismas acciones se usan en todas las tarjetas, para no duplicar la
  // lógica de permisos.
  //
  // Las acciones van SIEMPRE en una sola fila (nunca se parten en dos
  // líneas). Cuando la tarjeta es angosta (< 420 px) se ocultan los iconos
  // y se reduce el relleno horizontal ANTES que tocar el texto: el texto se
  // mantiene siempre en 12 px y completo.
  const renderAcciones = (c) => {
    const paso = pasoDeEstado(c.estado?.codigo)
    const editable = c.estado?.codigo === 'borrador' || c.estado?.codigo === 'publicada'

    // El aspirante ve UNA sola acción: "Ver información". Siempre disponible,
    // incluso si la convocatoria ya no está publicada: el detalle absorbe el 404.
    if (esAspirante) {
      return (
        <Boton
          variante="primario"
          tamano="sm"
          className={CLASE_BOTON_ACCION}
          onClick={() => navigate(`/convocatorias/${c.id}`)}
          aria-label={`Ver información de ${c.nombre}`}
        >
          <IconoOjo className={CLASE_ICONO_ACCION} />
          <span className="whitespace-nowrap">Ver información</span>
        </Boton>
      )
    }

    // Quien gestiona ve, en este orden: VER el detalle (acción principal,
    // verde del sistema), EDITAR (contorno) y CERRAR (contorno rojo, para
    // distinguirlo de los otros dos). Cerrar SIEMPRE pide confirmación.
    return (
      <>
        <Boton
          variante="primario"
          tamano="sm"
          className={CLASE_BOTON_ACCION}
          onClick={() => navigate(`/convocatorias/${c.id}`)}
          aria-label={`Ver detalle de ${c.nombre}`}
        >
          <IconoOjo className={CLASE_ICONO_ACCION} />
          <span className="whitespace-nowrap">Ver detalle</span>
        </Boton>

        {gestiona && editable && (
          <Boton
            variante="secundario"
            tamano="sm"
            className={CLASE_BOTON_ACCION}
            onClick={() => navigate(`/convocatorias/${c.id}/editar`)}
            aria-label={`Editar ${c.nombre}`}
          >
            <IconoLapiz className={CLASE_ICONO_ACCION} />
            <span className="whitespace-nowrap">Editar</span>
          </Boton>
        )}

        {gestiona && paso && (
          <Boton
            variante="peligroSuave"
            tamano="sm"
            className={CLASE_BOTON_ACCION}
            disabled={accionandoId === c.id}
            onClick={() => avanzarEstado(c, paso)}
            aria-label={`${paso.etiqueta} ${c.nombre}`}
          >
            <IconoCandado className={CLASE_ICONO_ACCION} />
            <span className="whitespace-nowrap">{paso.etiqueta}</span>
          </Boton>
        )}
      </>
    )
  }

  const totalTexto = `${meta.total} ${meta.total === 1 ? 'convocatoria' : 'convocatorias'}`

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>Convocatorias</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>
            {gestiona
              ? 'Gestiona y consulta las convocatorias de los procesos de selección.'
              : 'Consulta las convocatorias publicadas y revisa sus condiciones.'}
          </p>
        </div>

        {gestiona && (
          <Boton
            onClick={() => navigate('/convocatorias/nueva')}
            className="self-start sm:self-auto"
          >
            <IconoMas className="h-4 w-4" />
            Nueva convocatoria
          </Boton>
        )}
      </div>

      {/* Buscador y filtros. El estado solo lo ve quien gestiona; la ficha,
          solo quien puede listar fichas. El contador vive en la misma barra. */}
      <Tarjeta className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-sena-texto-suave">
                <IconoLupa />
              </span>
              <input
                type="search"
                placeholder={
                  gestionaEstricto
                    ? 'Buscar por nombre, código o cargo...'
                    : 'Buscar por nombre o cargo...'
                }
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
                aria-label={
                  gestionaEstricto
                    ? 'Buscar convocatorias por nombre, código o cargo'
                    : 'Buscar convocatorias por nombre o cargo'
                }
                className={`${CLASE_INPUT} w-full pl-10`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
              {gestionaEstricto && (
                <select
                  value={filtroEstado}
                  onChange={(e) => {
                    setFiltroEstado(e.target.value)
                    setPagina(1)
                  }}
                  aria-label="Filtrar por estado"
                  className={`${CLASE_INPUT} min-w-[10rem]`}
                >
                  <option value="">Todos los estados</option>
                  {opcionesEstado.map((o) => (
                    <option key={o.codigo} value={o.codigo}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              )}

              {puedeFiltrarFicha && (
                <select
                  value={filtroFicha}
                  onChange={(e) => {
                    setFiltroFicha(e.target.value)
                    setPagina(1)
                  }}
                  aria-label="Filtrar por ficha"
                  className={`${CLASE_INPUT} max-w-full sm:max-w-xs`}
                >
                  <option value="">Todas las fichas</option>
                  {fichas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.codigo} · {f.nombre_programa}
                    </option>
                  ))}
                </select>
              )}

              {hayFiltros && (
                <Boton variante="fantasma" tamano="sm" onClick={limpiarFiltros}>
                  <IconoX className="h-4 w-4" />
                  Limpiar filtros
                </Boton>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-sena-texto-suave" aria-live="polite">
            {cargando ? 'Cargando convocatorias…' : totalTexto}
          </p>
        </div>
      </Tarjeta>

      {error && <MensajeError>{error}</MensajeError>}

      {cargando && (
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
        >
          {[0, 1, 2].map((i) => (
            <Tarjeta key={i} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div className={`${CLASE_ESQUELETO} h-4 w-24`} />
                <div className={`${CLASE_ESQUELETO} h-5 w-16 rounded-full`} />
              </div>
              <div className={`${CLASE_ESQUELETO} mt-4 h-5 w-4/5`} />
              <div className={`${CLASE_ESQUELETO} mt-2 h-4 w-3/5`} />
              <div className="mt-4 flex gap-2">
                <div className={`${CLASE_ESQUELETO} h-6 w-20 rounded-full`} />
                <div className={`${CLASE_ESQUELETO} h-6 w-24 rounded-full`} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
              </div>
              <div className={`${CLASE_ESQUELETO} mt-5 h-9 w-full`} />
            </Tarjeta>
          ))}
          <span className="sr-only">Cargando convocatorias…</span>
        </div>
      )}

      {!cargando && !error && convocatorias.length === 0 && (
        <Tarjeta className="p-10 text-center" role="status">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sena-fondo text-sena-azul dark:bg-sena-noche/50 dark:text-sena-texto-suave">
            <IconoLupa className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-sena-azul dark:text-sena-texto">
            {hayFiltros ? 'No hay convocatorias con esos filtros' : 'Todavía no hay convocatorias'}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-sena-texto-suave">
            {hayFiltros
              ? 'Prueba con otro término de búsqueda o quita los filtros para ver todas.'
              : gestiona
                ? 'Crea la primera convocatoria para empezar a recibir postulaciones.'
                : 'Cuando se publique una convocatoria, aparecerá aquí.'}
          </p>
          {hayFiltros ? (
            <Boton
              variante="secundario"
              tamano="sm"
              className="mt-4"
              onClick={limpiarFiltros}
            >
              <IconoX className="h-4 w-4" />
              Limpiar filtros
            </Boton>
          ) : gestiona ? (
            <Boton tamano="sm" className="mt-4" onClick={() => navigate('/convocatorias/nueva')}>
              <IconoMas className="h-4 w-4" />
              Nueva convocatoria
            </Boton>
          ) : null}
        </Tarjeta>
      )}

      {/* Rejilla 3/2/1. Cada tarjeta usa solo campos del resumen: nada de
          llamadas al detalle por tarjeta. */}
      {!cargando && convocatorias.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {convocatorias.map((c) => {
            const documentos = c.documentos ?? []
            const obligatorios = documentos.filter((d) => d.obligatorio).length
            // "Cierra en N días" solo cuando faltan 3 días o menos (se calcula
            // con las fechas de la convocatoria, sin zona horaria ambigua).
            const cierraPronto = textoCierraPronto(c.fecha_cierre)

            return (
              <article
                key={c.id}
                className={`${CLASE_TARJETA_PLANA} @container flex h-full flex-col p-5 transition-colors hover:border-sena-azul/40 dark:hover:border-sena-borde`}
              >
                {/* 1) Fila superior: identificador (solo gestión) a la
                    izquierda y estado a la derecha. El Aspirante no ve el
                    identificador: es un dato de gestión. */}
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 truncate pt-0.5 font-mono text-xs font-medium tracking-wide text-slate-500 dark:text-sena-texto-suave">
                    {gestionaEstricto ? c.codigo : null}
                  </span>
                  {(gestionaEstricto || c.estado?.codigo !== 'cerrada') && (
                    <EtiquetaEstado codigo={c.estado?.codigo} nombre={c.estado?.nombre} />
                  )}
                </div>

                {/* 2) Identidad: título a dos líneas como máximo (para que las
                    tarjetas de la fila conserven la misma altura) con el
                    nombre completo en el tooltip, y debajo la línea
                    secundaria "cargo · área". */}
                <div className="mt-4">
                  <h3
                    title={c.nombre}
                    className="line-clamp-2 text-base font-semibold leading-snug text-sena-azul dark:text-sena-texto"
                  >
                    {c.nombre}
                  </h3>
                  <p
                    title={[c.cargo, c.area].filter(Boolean).join(' · ')}
                    className="mt-1.5 line-clamp-1 text-sm text-slate-600 dark:text-sena-texto-suave"
                  >
                    {c.cargo}
                    {c.area && <span> · {c.area}</span>}
                  </p>
                </div>

                {/* 3) Chips en orden fijo: modalidad, tipo de contrato y tipo
                    de convocatoria. Cada uno dice qué es (title y aria-label),
                    porque el chip solo lleva el valor. */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.modalidad?.nombre && (
                    <span
                      title={`Modalidad: ${c.modalidad.nombre}`}
                      aria-label={`Modalidad: ${c.modalidad.nombre}`}
                      className={CLASE_CHIP}
                    >
                      {c.modalidad.nombre}
                    </span>
                  )}
                  {c.tipo_contrato?.nombre && (
                    <span
                      title={`Tipo de contrato: ${c.tipo_contrato.nombre}`}
                      aria-label={`Tipo de contrato: ${c.tipo_contrato.nombre}`}
                      className={CLASE_CHIP}
                    >
                      {c.tipo_contrato.nombre}
                    </span>
                  )}
                  {c.tipo_convocatoria?.nombre && (
                    <span
                      title={`Tipo de convocatoria: ${c.tipo_convocatoria.nombre}`}
                      aria-label={`Tipo de convocatoria: ${c.tipo_convocatoria.nombre}`}
                      className={CLASE_CHIP}
                    >
                      {c.tipo_convocatoria.nombre}
                    </span>
                  )}
                </div>

                {/* 4) Cuadrícula de datos con la etiqueta arriba y el valor
                    abajo. «Aspirantes» es el quinto dato y solo lo ve quien
                    puede gestionar: el Aspirante nunca lo ve. */}
                <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3.5">
                  <div>
                    <dt className={CLASE_META_DT}>Publicación</dt>
                    <dd className={CLASE_META_DD}>{formatearFecha(c.fecha_apertura)}</dd>
                  </div>
                  <div>
                    <dt className={CLASE_META_DT}>Cierre</dt>
                    <dd className={CLASE_META_DD}>{formatearFecha(c.fecha_cierre)}</dd>
                    {cierraPronto && (
                      <dd className="mt-0.5 text-xs font-medium text-sena-azul dark:text-sena-texto">
                        {cierraPronto}
                      </dd>
                    )}
                  </div>
                  <div>
                    <dt className={CLASE_META_DT}>Vacantes</dt>
                    <dd className={CLASE_META_DD}>{c.vacantes}</dd>
                  </div>
                  <div>
                    <dt className={CLASE_META_DT}>Documentos</dt>
                    <dd className={CLASE_META_DD}>
                      {documentos.length === 0 ? (
                        'Sin documentos'
                      ) : (
                        <>
                          {documentos.length}
                          <span className="ml-1 text-xs font-normal text-slate-500 dark:text-sena-texto-suave">
                            ·{' '}
                            {obligatorios === documentos.length
                              ? 'todos obligatorios'
                              : obligatorios === 0
                                ? 'opcionales'
                                : `${obligatorios} obligatorio${obligatorios === 1 ? '' : 's'}`}
                          </span>
                        </>
                      )}
                    </dd>
                  </div>
                  {gestiona && (
                    <div>
                      <dt className={CLASE_META_DT}>Aspirantes</dt>
                      <dd className={CLASE_META_DD}>{c.postulantes ?? 0}</dd>
                    </div>
                  )}
                </dl>

                {/* 5) Pie: las acciones en UNA sola fila, ocupando todo el
                    ancho de la tarjeta. «N aspirantes» ya no está aquí: es el
                    quinto dato de la cuadrícula. Al Aspirante le queda el
                    estado de su postulación, a la izquierda de la fila. */}
                <div className="mt-auto pt-5">
                  {esAspirante && c.mi_postulacion && (
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-sena-texto-suave">
                      <span>Tu postulación</span>
                      <EtiquetaPostulacion
                        codigo={c.mi_postulacion.estado?.codigo}
                        nombre={c.mi_postulacion.estado?.nombre}
                      />
                    </div>
                  )}

                  <div className="flex flex-nowrap items-center gap-2">
                    {renderAcciones(c)}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {!cargando && meta.total > 0 && meta.last_page > 1 && (
        <Tarjeta className="flex flex-col gap-3 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-600 dark:text-sena-texto-suave">
            Página {meta.current_page} de {Math.max(meta.last_page, 1)}
          </span>
          <div className="flex gap-2">
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={meta.current_page <= 1}
              aria-label="Página anterior"
            >
              <IconoFlechaIzquierda className="h-4 w-4" />
              Anterior
            </Boton>
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => setPagina((p) => Math.min(meta.last_page, p + 1))}
              disabled={meta.current_page >= meta.last_page}
              aria-label="Página siguiente"
            >
              Siguiente
              <IconoFlechaDerecha className="h-4 w-4" />
            </Boton>
          </div>
        </Tarjeta>
      )}
    </div>
  )
}
