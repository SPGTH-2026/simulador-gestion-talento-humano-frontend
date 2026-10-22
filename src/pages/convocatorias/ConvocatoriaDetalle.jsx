import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { detalleConvocatoria, cambiarEstadoConvocatoria } from '../../api/convocatorias'
import { listaMisPostulaciones } from '../../api/postulaciones'
import { mensajeError } from '../../api/mensajeError'
import { useAuth } from '../../auth/useAuth'
import DetalleConvocatoria from '../../components/convocatorias/DetalleConvocatoria'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import { IconoCandado, IconoLapiz } from '../../components/convocatorias/Iconos'
import PanelDocumentosPostulacion from '../../components/postulacion/PanelDocumentosPostulacion'
import Boton from '../../components/ui/Boton'
import { MensajeError } from '../../components/ui/Mensaje'
import { esEditable, pasoDeEstado } from '../../lib/convocatorias'
import {
  estadoVentana,
  formatearFecha,
  formatearFechaHora,
  textoVentana,
} from '../../lib/ventanaPostulacion'
import { CLASE_TARJETA } from '../../lib/estilos'

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
  const { user, can } = useAuth()

  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Para el aspirante cuyo detalle responde 404 (convocatoria ya no publicada):
  // se rescata el resumen embebido de /postulaciones en vez de un callejón.
  const [noPublicada, setNoPublicada] = useState(null)
  const [buscandoResumen, setBuscandoResumen] = useState(false)
  // Acción de estado en vuelo (vista de gestión).
  const [accionando, setAccionando] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')

  // La vista de gestión la decide el PERMISO (no el rol): el subrol
  // gestor_convocatorias del aprendiz también entra.
  const puedeGestionar = can('convocatorias:gestionar')

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
        <div className={`${CLASE_TARJETA} max-w-2xl p-6`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
            Convocatoria
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
  // El panel se monta para TODO aspirante en una convocatoria publicada, tenga
  // o no postulación: sin ella el propio panel dibuja las secciones en pendiente
  // y crea el BORRADOR SILENCIOSO en la primera acción de guardado. Así la
  // pestaña Documentos es el espacio real de la postulación desde el inicio.
  const esAspirantePublicada =
    user?.role === 'aspirante' && detalle.estado?.codigo === 'publicada'
  const estadoPostulacion = detalle.mi_postulacion?.estado?.codigo ?? null
  const mostrarPanel = esAspirantePublicada

  const ventana = estadoVentana(detalle)

  // ── Acción de la barra inferior ───────────────────────────────────────
  // Solo para el aspirante que puede postularse: instructor, super admin y el
  // resto de roles no ven barra. NO es una segunda vía de postulación — no llama
  // a la API ni crea nada (el borrador lo crea el panel, de forma silenciosa, en
  // su primera acción de guardado). Aquí solo se salta a la pestaña Documentos,
  // donde vive el panel.
  const irADocumentos = () => document.getElementById('tab-documentos')?.click()

  let accionInferior = null
  if (esAspirantePublicada) {
    // Ventana cerrada o todavía sin abrir: se muestra el botón DESHABILITADO con
    // el motivo visible, para que el aspirante entienda por qué no puede seguir.
    const cerrada = ventana !== 'abierta'
    if (estadoPostulacion === 'postulada') {
      accionInferior = {
        etiqueta: 'Ver mis documentos',
        motivo: cerrada ? textoVentana(detalle) : '',
        ayuda: 'Tu postulación ya se envió. Puedes consultar y descargar los documentos que adjuntaste.',
        deshabilitado: false,
        onClick: irADocumentos,
        insignia: true,
      }
    } else if (estadoPostulacion === 'retirada') {
      // La reapertura la decide el panel (y el backend): aquí solo se salta.
      accionInferior = {
        etiqueta: 'Reabrir postulación',
        motivo: cerrada ? textoVentana(detalle) : '',
        ayuda: 'Retiraste esta postulación. Reábrela para volver a completar tus documentos.',
        deshabilitado: cerrada,
        onClick: irADocumentos,
        insignia: true,
      }
    } else {
      // Sin postulación o con una en borrador: la acción es la misma y siempre
      // lleva a la pestaña Documentos. El texto corto evita repetir "Siguiente".
      accionInferior = {
        etiqueta: 'Continuar a documentos',
        motivo: cerrada ? textoVentana(detalle) : '',
        ayuda:
          estadoPostulacion === 'borrador'
            ? 'Tu postulación está en borrador. Complétala y envíala desde la pestaña Documentos.'
            : 'Completa tus datos y adjunta los documentos en la pestaña Documentos.',
        deshabilitado: cerrada,
        onClick: irADocumentos,
        insignia: estadoPostulacion === 'borrador',
      }
    }
  }

  // ── Vista de gestión: acciones según el estado ────────────────────────
  // Solo quien tiene 'convocatorias:gestionar'. Son las MISMAS acciones del
  // listado (editar y el candado de un paso), con las reglas de estado ya
  // escritas: no se inventan transiciones.
  const paso = pasoDeEstado(detalle.estado?.codigo)
  const editable = esEditable(detalle)

  const avanzarEstado = async () => {
    if (!paso) return
    if (!window.confirm(`¿${paso.etiqueta} de "${detalle.nombre}"?`)) return

    setAccionando(true)
    setErrorAccion('')

    try {
      const res = await cambiarEstadoConvocatoria(detalle.id, { estado: paso.destino })
      setDetalle(res.data)
    } catch (e) {
      setErrorAccion(mensajeError(e))
    } finally {
      setAccionando(false)
    }
  }

  // Mismas acciones y misma jerarquía que las tarjetas del listado: primero
  // consultar (aquí ya se está), luego editar y por último cerrar.
  const accionesGestion = puedeGestionar ? (
    <div className="flex flex-wrap items-center gap-2">
      {errorAccion && <MensajeError>{errorAccion}</MensajeError>}

      {editable && (
        <Boton
          variante="secundario"
          tamano="sm"
          className="shrink-0"
          onClick={() => navigate(`/convocatorias/${detalle.id}/editar`)}
        >
          <IconoLapiz className="h-4 w-4" />
          Editar
        </Boton>
      )}

      {paso && (
        <Boton
          variante="peligroSuave"
          tamano="sm"
          className="ml-1 shrink-0"
          disabled={accionando}
          onClick={avanzarEstado}
        >
          <IconoCandado className="h-4 w-4" />
          {paso.etiqueta}
        </Boton>
      )}
    </div>
  ) : null

  return (
    <>
      {accionesGestion && (
        <div className="flex flex-wrap items-center justify-end gap-2">{accionesGestion}</div>
      )}

      <DetalleConvocatoria
        convocatoria={detalle}
        onVolver={() => navigate('/convocatorias')}
        panelDocumentos={
          mostrarPanel ? (
            <PanelDocumentosPostulacion
              convocatoria={detalle}
              documentosConvocatoria={detalle.documentos}
              skillsConvocatoriaNombres={detalle.skills}
              miPostulacion={detalle.mi_postulacion}
              onPostulacionCreada={aplicarPostulacion}
              onVerDocumentos={(pid) => navigate(`/postulaciones/${pid}/documentos`)}
              onEnviado={() =>
                navigate('/mis-postulaciones', {
                  state: { exito: `¡Tu postulación ha sido registrada!` },
                })
              }
            />
          ) : null
        }
        accionInferior={
          accionInferior
            ? {
                ...accionInferior,
                codigoEstado: estadoPostulacion,
                nombreEstado: detalle.mi_postulacion?.estado?.nombre,
              }
            : null
        }
      />
    </>
  )
}