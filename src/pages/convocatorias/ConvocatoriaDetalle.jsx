import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { detalleConvocatoria } from '../../api/convocatorias'
import { listaMisPostulaciones } from '../../api/postulaciones'
import { mensajeError } from '../../api/mensajeError'
import { useAuth } from '../../auth/useAuth'
import DetalleConvocatoria from '../../components/convocatorias/DetalleConvocatoria'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import PanelDocumentosPostulacion from '../../components/postulacion/PanelDocumentosPostulacion'
import { formatearFecha, formatearFechaHora } from '../../lib/ventanaPostulacion'

const CLASE_BOTON =
  'rounded border border-sena-azul/25 px-4 py-2 text-sm font-medium text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'

// Vista de solo lectura propia (componente DetalleConvocatoria.jsx). El wizard
// queda únicamente para Nueva/Editar y no se toca aquí.
export default function ConvocatoriaDetalle() {
  const { id } = useParams()

  // key={id} re-monta el contenido al navegar de una convocatoria a otra sin
  // salir de la ruta (React Router conserva la instancia): así el estado
  // simulado de archivos y el resumen 404 nunca quedan cruzados entre ids.
  return <ContenidoDetalle key={id} id={id} />
}

function ContenidoDetalle({ id }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Para el aspirante cuyo detalle responde 404 (convocatoria ya no publicada):
  // se rescata el resumen embebido de /postulaciones en vez de un callejón.
  const [noPublicada, setNoPublicada] = useState(null)
  const [buscandoResumen, setBuscandoResumen] = useState(false)

  useEffect(() => {
    let activo = true

    detalleConvocatoria(id)
      .then((res) => {
        if (!activo) return
        setDetalle(res.data)
        setError('')
      })
      .catch((e) => {
        if (!activo) return
        // Solo el 404 del aspirante cae al resumen de sus postulaciones; red,
        // 500, 403, etc. muestran el mensaje normal de mensajeError().
        if (user?.role === 'aspirante' && e.response?.status === 404) {
          setBuscandoResumen(true)
          listaMisPostulaciones({ per_page: 100 })
            .then((res) => {
              if (!activo) return
              const encontrada = (res.data ?? []).find(
                (p) => p.convocatoria?.id === Number(id),
              )
              if (encontrada) {
                setNoPublicada(encontrada)
              } else {
                setError('Esta convocatoria no está disponible para consulta.')
              }
            })
            .catch(() => {
              if (activo) setError('Esta convocatoria no está disponible para consulta.')
            })
            .finally(() => {
              if (activo) setBuscandoResumen(false)
            })
        } else {
          setError(mensajeError(e))
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [id, user?.role])

  // 201/200: el panel crea el borrador de forma silenciosa y avisa por acá para
  // reflejarlo sin recargar la convocatoria entera.
  const aplicarPostulacion = (postulacion) => {
    setDetalle((prev) =>
      prev
        ? { ...prev, mi_postulacion: { id: postulacion.id, estado: postulacion.estado } }
        : prev,
    )
  }

  if (cargando) {
    return <p className="text-slate-500 dark:text-sena-texto-suave">Cargando convocatoria...</p>
  }

  // El aspirante postulado a una convocatoria que ya no está publicada (el
  // detalle responde 404) ve su resumen embebido de /postulaciones en vez de
  // una pantalla de error sin salida.
  if (noPublicada) {
    const conv = noPublicada.convocatoria
    return (
      <div className="flex flex-col gap-4">
        <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 dark:border-sena-borde dark:bg-sena-superficie">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
            {conv?.codigo ?? 'Convocatoria'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-sena-texto">
            {conv?.nombre ?? 'Convocatoria'}
          </h1>

          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-600 dark:text-sena-texto-suave">Cargo</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-sena-texto">{conv?.cargo ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600 dark:text-sena-texto-suave">Área</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-sena-texto">{conv?.area ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600 dark:text-sena-texto-suave">Apertura</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-sena-texto">
                {formatearFecha(conv?.fecha_apertura)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600 dark:text-sena-texto-suave">Cierre</dt>
              <dd className="mt-0.5 text-slate-700 dark:text-sena-texto">
                {formatearFecha(conv?.fecha_cierre)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600 dark:text-sena-texto-suave">
                Estado de la convocatoria
              </dt>
              <dd className="mt-0.5">
                <EtiquetaEstado codigo={conv?.estado?.codigo} nombre={conv?.estado?.nombre} />
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600 dark:text-sena-texto-suave">
                Tu postulación
              </dt>
              <dd className="mt-0.5">
                <EtiquetaPostulacion
                  codigo={noPublicada.estado?.codigo}
                  nombre={noPublicada.estado?.nombre}
                />
                {noPublicada.fecha_postulacion && (
                  <span className="mt-1 block text-xs text-slate-500 dark:text-sena-texto-suave">
                    {noPublicada.estado?.codigo === 'borrador' ? 'Iniciada' : 'Postulada'} el{' '}
                    {formatearFechaHora(noPublicada.fecha_postulacion)}
                    {noPublicada.fecha_retiro && (
                      <> · Retirada el {formatearFechaHora(noPublicada.fecha_retiro)}</>
                    )}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <p className="mt-4 rounded bg-sena-cielo/20 p-3 text-sm text-slate-700 dark:bg-sena-superficie-alta dark:text-sena-texto-suave">
            La convocatoria ya no está publicada y su detalle completo no está
            disponible. Tu postulación sigue visible en Mis postulaciones.
          </p>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/convocatorias')} className={CLASE_BOTON}>
            ← Convocatorias
          </button>
          <button
            type="button"
            onClick={() => navigate('/mis-postulaciones')}
            className={CLASE_BOTON}
          >
            Ver mis postulaciones
          </button>
        </div>
      </div>
    )
  }

  if (buscandoResumen) {
    return (
      <p className="text-slate-500 dark:text-sena-texto-suave">
        Consultando tu postulación...
      </p>
    )
  }

  if (error || !detalle) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error || 'No se encontró la convocatoria.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/convocatorias')}
          className="self-start rounded border border-sena-azul/25 px-4 py-2 text-sm font-medium text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
        >
          ← Volver
        </button>
      </div>
    )
  }

  // Visibilidad del panel: para el aspirante, en una convocatoria publicada. El
  // panel permite llenar TODO (sexo, documentos, skills, extras y envío) en la
  // misma página, sin cambiar de vista. La ventana cerrada no lo bloquea: el
  // propio panel queda en solo lectura con el motivo.
  const mostrarDocumentos =
    user?.role === 'aspirante' && detalle.estado?.codigo === 'publicada'

  return (
    <div className="flex flex-col gap-4">
      {/* Vista de solo lectura propia. Al pie, el panel único para llenar todo
          (sexo, documentos, skills, extras y envío) sin cambiar de pantalla. */}
      <DetalleConvocatoria convocatoria={detalle} onVolver={() => navigate('/convocatorias')}>
        {mostrarDocumentos && (
          <PanelDocumentosPostulacion
            convocatoria={detalle}
            documentosConvocatoria={detalle.documentos}
            skillsConvocatoriaNombres={detalle.skills}
            miPostulacion={detalle.mi_postulacion}
            onPostulacionCreada={aplicarPostulacion}
            onVerDocumentos={(pid) => navigate(`/postulaciones/${pid}/documentos`)}
            onEnviado={() =>
              navigate('/mis-postulaciones', {
                state: { exito: `Enviaste tu postulación a "${detalle.nombre}".` },
              })
            }
          />
        )}
      </DetalleConvocatoria>
    </div>
  )
}