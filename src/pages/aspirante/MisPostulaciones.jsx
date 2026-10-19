import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { listaMisPostulaciones, cambiarEstadoPostulacion } from '../../api/postulaciones'
import { mensajeError } from '../../api/mensajeError'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import { BotonIcono, IconoOjo } from '../../components/convocatorias/Iconos'
import { estadoVentana, formatearFechaHora, textoVentana } from '../../lib/ventanaPostulacion'

const CLASE_ACCION =
  'rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'

const CLASE_NAV =
  'rounded border border-sena-azul/25 px-3 py-1.5 font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'

const COLUMNAS = 7

// "Mis postulaciones": solo las del autenticado (el backend filtra por user_id,
// sea cual sea el rol). Con el flujo de borrador (doc 31): un borrador se
// "continuar" o se "descarta" (retirada); una postulada se consulta o se
// "retira"; una retirada se "reabre" (vuelve a borrador) o se consulta en solo
// lectura ("Ver documentos"). El conteo de postulantes no vive aquí y, además,
// el backend ya excluye los borradores.
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

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-sena-borde dark:bg-sena-superficie">
        <table className="w-full min-w-200 text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-sena-borde dark:text-sena-texto-suave">
              <th className="p-3">Convocatoria</th>
              <th className="p-3">Cargo</th>
              <th className="p-3">Área</th>
              <th className="p-3">Fecha de postulación</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Estado convocatoria</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={COLUMNAS} className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  Cargando postulaciones...
                </td>
              </tr>
            )}

            {!cargando && postulaciones.length === 0 && (
              <tr>
                <td colSpan={COLUMNAS} className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  Aún no te has postulado a ninguna convocatoria.{' '}
                  <Link to="/convocatorias" className="font-semibold text-sena-azul underline dark:text-sena-texto">
                    Ver convocatorias
                  </Link>
                </td>
              </tr>
            )}

            {!cargando &&
              postulaciones.map((p) => {
                const convocatoria = p.convocatoria
                const estadoCodigo = p.estado?.codigo
                const publicada = convocatoria?.estado?.codigo === 'publicada'
                const ventanaAbierta = estadoVentana(convocatoria) === 'abierta'
                const enVuelo = accionandoId === p.id

                return (
                  <tr key={p.id} className="hover:bg-sena-cielo/20 dark:hover:bg-sena-superficie-alta/20">
                    <td className="p-3">
                      <span className="block font-mono text-xs text-slate-500 dark:text-sena-texto-suave">
                        {convocatoria?.codigo}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-sena-texto">
                        {convocatoria?.nombre ?? '—'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-sena-texto">{convocatoria?.cargo ?? '—'}</td>
                    <td className="p-3 text-slate-700 dark:text-sena-texto">{convocatoria?.area ?? '—'}</td>
                    <td className="p-3 text-slate-700 dark:text-sena-texto">
                      {formatearFechaHora(p.fecha_postulacion)}
                    </td>
                    <td className="p-3">
                      <EtiquetaPostulacion codigo={estadoCodigo} nombre={p.estado?.nombre} />
                      {estadoCodigo === 'retirada' && p.fecha_retiro && (
                        <span className="mt-1 block text-xs text-slate-500 dark:text-sena-texto-suave">
                          Retirada el {formatearFechaHora(p.fecha_retiro)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <EtiquetaEstado
                        codigo={convocatoria?.estado?.codigo}
                        nombre={convocatoria?.estado?.nombre}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-end gap-1">
                        {/* Al detalle de la convocatoria. Si ya no está
                            publicada, el detalle muestra el resumen embebido
                            (fallback 404) en vez de un callejón. */}
                        <BotonIcono
                          etiqueta="Ver información"
                          onClick={() => navigate(`/convocatorias/${convocatoria?.id}`)}
                        >
                          <IconoOjo />
                        </BotonIcono>

                        {estadoCodigo === 'borrador' && (
                          <>
                            <button
                              type="button"
                              disabled={enVuelo}
                              onClick={() => irADocumentos(p)}
                              className={CLASE_ACCION}
                            >
                              Continuar postulación
                            </button>
                            <button
                              type="button"
                              disabled={!publicada || enVuelo}
                              onClick={() => cambiarEstado(p, 'retirada', 'descartar')}
                              className={CLASE_ACCION}
                            >
                              {enVuelo ? 'Descartando...' : 'Descartar'}
                            </button>
                            {!publicada && (
                              <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
                                La convocatoria ya no está publicada
                              </span>
                            )}
                          </>
                        )}

                        {estadoCodigo === 'postulada' && (
                          <>
                            <button
                              type="button"
                              disabled={enVuelo}
                              onClick={() => irADocumentos(p)}
                              className={CLASE_ACCION}
                            >
                              Ver documentos
                            </button>
                            <button
                              type="button"
                              disabled={!publicada || enVuelo}
                              onClick={() => cambiarEstado(p, 'retirada', 'retirar')}
                              className={CLASE_ACCION}
                            >
                              {enVuelo ? 'Retirando...' : 'Retirarse'}
                            </button>
                            {!publicada && (
                              <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
                                La convocatoria ya no está publicada
                              </span>
                            )}
                          </>
                        )}

                        {estadoCodigo === 'retirada' && (
                          <>
                            <button
                              type="button"
                              disabled={enVuelo}
                              onClick={() => irADocumentos(p)}
                              className={CLASE_ACCION}
                            >
                              Ver documentos
                            </button>
                            <button
                              type="button"
                              disabled={!ventanaAbierta || enVuelo}
                              onClick={() => reabrir(p)}
                              className={CLASE_ACCION}
                            >
                              {enVuelo ? 'Reabriendo...' : 'Reabrir'}
                            </button>
                            {!ventanaAbierta && (
                              <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
                                {textoVentana(convocatoria)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-sena-texto-suave">
        <span>
          Página {meta.current_page ?? 1} de {Math.max(meta.last_page ?? 1, 1)} ·{' '}
          {meta.total ?? 0} postulación(es)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={(meta.current_page ?? 1) <= 1}
            className={CLASE_NAV}
          >
            Anterior
          </button>
          <button
            onClick={() => setPagina((p) => Math.min(meta.last_page ?? 1, p + 1))}
            disabled={(meta.current_page ?? 1) >= (meta.last_page ?? 1)}
            className={CLASE_NAV}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
