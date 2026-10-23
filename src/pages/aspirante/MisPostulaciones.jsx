import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { listaMisPostulaciones, cambiarEstadoPostulacion } from '../../api/postulaciones'
import { mensajeError } from '../../api/mensajeError'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import EtiquetaVentana from '../../components/convocatorias/EtiquetaVentana'
import Boton from '../../components/ui/Boton'
import { estadoVentana, formatearFechaHora, textoVentana } from '../../lib/ventanaPostulacion'
import { CLASE_META_DT, CLASE_TARJETA } from '../../lib/estilos'

// Botones de acción de una fila: 40 px de alto, 12 px de texto y separacion de
// 8 px. El principal es el verde del sistema; el secundario, de contorno; el
// destructivo, de contorno rojo.
const CLASE_ACCION = 'min-h-10'

const CLASE_ENLACE_TITULO =
  'font-semibold text-sena-azul underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40 dark:text-sena-texto'

// "Mis postulaciones": solo las del autenticado (el backend filtra por user_id,
// sea cual sea el rol). LLEGAN TODAS, también los borradores: el listado no
// filtra por estado.
//
// La fila muestra: la convocatoria (el título es un enlace a su detalle), la
// fecha de postulación, el estado de la postulación, el estado DERIVADO de la
// convocatoria (si la ventana está abierta, si aún no abre o si ya cerró) y las
// acciones según el estado.
//
// En escritorio es una tabla; por debajo de 768 px la misma información se
// apila en tarjetas (una por postulación), sin scroll horizontal.

// Convocatoria: título (enlace al detalle) y debajo "Cargo · Área".
// El título reserva SIEMPRE dos líneas (aunque el texto ocupe una): así las
// filas de la tabla quedan a la misma altura.
//
// Si la convocatoria está CERRADA el título NO es un enlace: su detalle ya no
// está disponible para quien no gestiona (el backend responde 404), así que el
// enlace llevaría a un error. Se muestra como texto plano con el mismo tamaño.
function BloqueConvocatoria({ convocatoria }) {
  const secundaria = [convocatoria?.cargo, convocatoria?.area].filter(Boolean).join(' · ')

  const cerrada =
    convocatoria?.estado?.codigo === 'cerrada' || estadoVentana(convocatoria) === 'cerrada'

  return (
    <div className="min-w-0">
      {cerrada ? (
        <span
          title={convocatoria?.nombre ?? undefined}
          className="line-clamp-2 block min-h-[2.75rem] font-semibold text-slate-700 dark:text-sena-texto"
        >
          {convocatoria?.nombre ?? '—'}
        </span>
      ) : (
        <Link
          to={`/convocatorias/${convocatoria?.id}`}
          title={convocatoria?.nombre ?? undefined}
          className={`line-clamp-2 min-h-[2.75rem] ${CLASE_ENLACE_TITULO}`}
        >
          {convocatoria?.nombre ?? '—'}
        </Link>
      )}
      {secundaria && (
        <p
          title={secundaria}
          className="mt-0.5 line-clamp-1 text-sm text-slate-600 dark:text-sena-texto-suave"
        >
          {secundaria}
        </p>
      )}
    </div>
  )
}

// Estado de la postulación ("Estado") y, si está retirada, la fecha en una
// sola línea debajo del badge. El bloque va centrado: son datos cortos y así la
// columna queda equilibrada con las de al lado.
function BloqueEstadoPostulacion({ postulacion }) {
  const codigo = postulacion.estado?.codigo

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <EtiquetaPostulacion codigo={codigo} nombre={postulacion.estado?.nombre} />
      {codigo === 'retirada' && postulacion.fecha_retiro && (
        <span className="whitespace-nowrap text-xs text-slate-500 dark:text-sena-texto-suave">
          Retirada el {formatearFechaHora(postulacion.fecha_retiro)}
        </span>
      )}
    </div>
  )
}

// Acciones de la fila: una sola línea, alineada a la derecha. Cada estado
// tiene su propia combinación (no se inventan acciones).
function BloqueAcciones({
  postulacion,
  publicada,
  ventanaAbierta,
  enVuelo,
  irADocumentos,
  cambiarEstado,
  reabrir,
}) {
  const codigo = postulacion.estado?.codigo

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-nowrap items-center justify-end gap-2">
        {codigo === 'borrador' && (
          <>
            <Boton
              variante="primario"
              tamano="sm"
              className={CLASE_ACCION}
              disabled={enVuelo}
              onClick={() => irADocumentos(postulacion)}
            >
              Continuar postulación
            </Boton>
            <Boton
              variante="peligroSuave"
              tamano="sm"
              className={CLASE_ACCION}
              disabled={!publicada || enVuelo}
              onClick={() => cambiarEstado(postulacion, 'retirada', 'descartar')}
            >
              {enVuelo ? 'Descartando...' : 'Descartar'}
            </Boton>
          </>
        )}

        {codigo === 'postulada' && (
          <>
            <Boton
              variante="primario"
              tamano="sm"
              className={CLASE_ACCION}
              disabled={enVuelo}
              onClick={() => irADocumentos(postulacion)}
            >
              Ver documentos
            </Boton>
            <Boton
              variante="peligroSuave"
              tamano="sm"
              className={CLASE_ACCION}
              disabled={!publicada || enVuelo}
              onClick={() => cambiarEstado(postulacion, 'retirada', 'retirar')}
            >
              {enVuelo ? 'Retirando...' : 'Retirarse'}
            </Boton>
          </>
        )}

        {codigo === 'retirada' && (
          <>
            <Boton
              variante="secundario"
              tamano="sm"
              className={CLASE_ACCION}
              disabled={enVuelo}
              onClick={() => irADocumentos(postulacion)}
            >
              Ver documentos
            </Boton>
            <Boton
              variante="primario"
              tamano="sm"
              className={CLASE_ACCION}
              disabled={!ventanaAbierta || enVuelo}
              onClick={() => reabrir(postulacion)}
            >
              {enVuelo ? 'Reabriendo...' : 'Reabrir'}
            </Boton>
          </>
        )}
      </div>

      {/* Los avisos NO son botones: van debajo de la fila de acciones. */}
      {(codigo === 'borrador' || codigo === 'postulada') && !publicada && (
        <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
          La convocatoria ya no está publicada
        </span>
      )}

      {codigo === 'retirada' && !ventanaAbierta && (
        <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {textoVentana(postulacion.convocatoria)}
        </span>
      )}
    </div>
  )
}

export default function MisPostulaciones() {
  const navigate = useNavigate()
  const location = useLocation()
  const [postulaciones, setPostulaciones] = useState([])
  const [meta, setMeta] = useState({})
  const [pagina, setPagina] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Mensaje de éxito que llega al volver de enviar la postulación (router state).
  const [exito] = useState(location.state?.exito ?? '')
  // id de la fila cuya acción está en vuelo (bloquea su botón).
  const [accionandoId, setAccionandoId] = useState(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let activo = true
    listaMisPostulaciones({ page: pagina })
      .then((res) => {
        if (!activo) return
        setPostulaciones(res.data ?? [])
        setMeta(res.meta ?? {})
        setError('')
      })
      .catch((e) => {
        if (activo) setError(mensajeError(e))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [pagina, recarga])

  // Descarta un borrador o retira una postulada (mismo destino 'retirada') o
  // reabre una retirada (destino 'borrador'). Devuelve la postulación actualizada
  // o null si falló o el usuario canceló.
  const cambiarEstado = async (postulacion, destino, accion) => {
    const nombre = postulacion.convocatoria?.nombre ?? 'la convocatoria'
    const pregunta =
      accion === 'descartar'
        ? `¿Descartar tu borrador de postulación a "${nombre}"? Podrás reabrirlo.`
        : accion === 'retirar'
          ? `¿Retirar tu postulación a "${nombre}"?`
          : `¿Reabrir tu postulación a "${nombre}"?`
    if (!window.confirm(pregunta)) return null

    setAccionandoId(postulacion.id)
    setError('')
    try {
      const actualizada = await cambiarEstadoPostulacion(postulacion.id, destino)
      // Se actualiza SOLO la fila tocada: la página actual no se pierde.
      setPostulaciones((prev) =>
        prev.map((p) => (p.id === postulacion.id ? { ...p, ...actualizada } : p)),
      )
      return actualizada
    } catch (e) {
      // 422 (retiro con la convocatoria no publicada, reapertura fuera de
      // ventana), 403 y 404 ya vienen en español: se muestran y se resincroniza.
      setError(mensajeError(e))
      setRecarga((n) => n + 1)
      return null
    } finally {
      setAccionandoId(null)
    }
  }

  // Reabrir (retirada -> borrador) y seguir en el paso de documentos.
  const reabrir = async (postulacion) => {
    const actualizada = await cambiarEstado(postulacion, 'borrador', 'reabrir')
    if (actualizada) navigate(`/postulaciones/${postulacion.id}/documentos`)
  }

  // Ir al paso de documentos de esta postulación (continuar borrador / ver
  // documentos de una postulada).
  const irADocumentos = (postulacion) =>
    navigate(`/postulaciones/${postulacion.id}/documentos`)

  // Datos de una postulación que usan los bloques de arriba.
  const contexto = (postulacion) => {
    const convocatoria = postulacion.convocatoria

    return {
      postulacion,
      publicada: convocatoria?.estado?.codigo === 'publicada',
      ventanaAbierta: estadoVentana(convocatoria) === 'abierta',
      enVuelo: accionandoId === postulacion.id,
      irADocumentos,
      cambiarEstado,
      reabrir,
    }
  }

  const totalPaginas = Math.max(meta.last_page ?? 1, 1)
  const total = meta.total ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">Mis postulaciones</h1>
        <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
          Completa y envía tus borradores, consulta tus postulaciones, retíralas o
          reábrelas mientras la convocatoria lo permita.
        </p>
      </div>

      {exito && (
        <p
          role="status"
          className="rounded bg-emerald-100 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {exito}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-slate-500 dark:text-sena-texto-suave">Cargando postulaciones...</p>
      ) : postulaciones.length === 0 ? (
        // Sin postulaciones: mensaje claro con enlace al listado.
        <div className={`${CLASE_TARJETA} flex flex-col items-center gap-3 p-8 text-center`}>
          <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
            Aún no te has postulado a ninguna convocatoria.
          </p>
          <Link
            to="/convocatorias"
            className="text-sm font-semibold text-sena-azul underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40 dark:text-sena-texto"
          >
            Ver convocatorias
          </Link>
        </div>
      ) : (
        <>
          {/* Escritorio: tabla de 5 columnas. */}
          <div className={`${CLASE_TARJETA} hidden overflow-x-auto md:block`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-sena-borde dark:text-sena-texto-suave">
                  <th className="p-3">Convocatoria</th>
                  <th className="p-3 text-center">Postulación</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Estado de la convocatoria</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {postulaciones.map((p) => {
                  const ctx = contexto(p)

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 align-middle last:border-0 hover:bg-sena-cielo/20 dark:border-sena-borde/60 dark:hover:bg-sena-superficie-alta/20"
                    >
                      <td className="p-3">
                        <BloqueConvocatoria convocatoria={p.convocatoria} />
                      </td>
                      <td className="whitespace-nowrap p-3 text-center text-slate-700 dark:text-sena-texto">
                        {formatearFechaHora(p.fecha_postulacion)}
                      </td>
                      <td className="p-3">
                        <BloqueEstadoPostulacion postulacion={p} />
                      </td>
                      <td className="p-3 text-center">
                        <EtiquetaVentana convocatoria={p.convocatoria} />
                      </td>
                      <td className="p-3">
                        <BloqueAcciones {...ctx} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Móvil: una tarjeta por postulación, con el mismo orden. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {postulaciones.map((p) => {
              const ctx = contexto(p)

              return (
                <li key={p.id} className={`${CLASE_TARJETA} flex flex-col gap-3 p-4`}>
                  <BloqueConvocatoria convocatoria={p.convocatoria} />

                  <dl className="grid grid-cols-2 gap-3 text-center">
                    <div>
                      <dt className={CLASE_META_DT}>Postulación</dt>
                      <dd className="mt-0.5 whitespace-nowrap text-sm text-slate-700 dark:text-sena-texto">
                        {formatearFechaHora(p.fecha_postulacion)}
                      </dd>
                    </div>
                    <div>
                      <dt className={CLASE_META_DT}>Estado</dt>
                      <dd className="mt-0.5">
                        <BloqueEstadoPostulacion postulacion={p} />
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className={CLASE_META_DT}>Estado de la convocatoria</dt>
                      <dd className="mt-0.5">
                        <EtiquetaVentana convocatoria={p.convocatoria} />
                      </dd>
                    </div>
                  </dl>

                  <BloqueAcciones {...ctx} />
                </li>
              )
            })}
          </ul>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-sena-texto-suave">
        <span>
          Página {meta.current_page ?? 1} de {totalPaginas} · {total} postulación(es)
        </span>

        {/* Anterior/Siguiente solo cuando hay más de una página. */}
        {totalPaginas > 1 && (
          <div className="flex gap-2">
            <Boton
              variante="secundario"
              tamano="sm"
              className="min-h-10"
              disabled={(meta.current_page ?? 1) <= 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Boton>
            <Boton
              variante="secundario"
              tamano="sm"
              className="min-h-10"
              disabled={(meta.current_page ?? 1) >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente
            </Boton>
          </div>
        )}
      </div>
    </div>
  )
}
