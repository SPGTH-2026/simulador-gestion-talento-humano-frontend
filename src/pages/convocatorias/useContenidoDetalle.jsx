import { useAccionesDetalle } from './useAccionesDetalle'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { detalleConvocatoria } from '../../api/convocatorias'
import { listaMisPostulaciones } from '../../api/postulaciones'
import { mensajeError } from '../../api/mensajeError'
import { useAuth } from '../../auth/useAuth'
import { formatearFecha, formatearFechaHora } from '../../lib/ventanaPostulacion'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import Boton from '../../components/ui/Boton'
import { MensajeError } from '../../components/ui/Mensaje'
import Icono from '../../components/ui/Icono'
import Cargando from '../../components/ui/Cargando'
import { CLASE_TARJETA } from '../../lib/estilos'

// Lógica de ContenidoDetalle: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useContenidoDetalle({ id }) {
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const confirmar = useConfirmacion()

  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Sube al reintentar la carga: vuelve a pedir el detalle sin recargar la página.
  const [intento, setIntento] = useState(0)
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

  // Acciones de la vista (aspirante, gestión y barra inferior): se calculan siempre, antes de cualquier retorno temprano.
  const useaccionesdetalleBloque = useAccionesDetalle({ accionando, confirmar, detalle, navigate, puedeGestionar, setAccionando, setDetalle, setErrorAccion, user })
  const { accionInferior, accionesGestion, avanzarEstado, editable, esAspirantePublicada, estadoPostulacion, hayAcciones, irADocumentos, mostrarPanel, paso, ventana } = useaccionesdetalleBloque

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
  }, [id, user?.role, intento])

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
    return <Cargando>Cargando convocatoria…</Cargando>
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
          <Boton variante="fantasma" tamano="tactil" onClick={() => navigate('/convocatorias')}>
            <Icono nombre="flechaIzquierda" className="size-4" />
          Convocatorias
          </Boton>
          <Boton variante="contorno" tamano="tactil"
            onClick={() => navigate('/mis-postulaciones')}>
            Ver mis postulaciones
          </Boton>
        </div>
      </div>
    )
  }

  if (buscandoResumen) {
    return <Cargando>Consultando tu postulación…</Cargando>
  }

  if (error || !detalle) {
    return (
      <div className="flex flex-col items-start gap-4">
        <MensajeError className="w-full">{error || 'No se encontró la convocatoria.'}</MensajeError>
        <div className="flex flex-wrap items-center gap-2">
          <Boton
            variante="contorno"
            tamano="tactil"
            onClick={() => {
              setError('')
              setCargando(true)
              setIntento((n) => n + 1)
            }}
          >
            Reintentar
          </Boton>
          <Boton variante="fantasma" tamano="tactil" onClick={() => navigate('/convocatorias')}>
            <Icono nombre="flechaIzquierda" className="size-4" />
            Volver
          </Boton>
        </div>
      </div>
    )
  }

    return {
      ...useaccionesdetalleBloque,
      accionInferior,
      accionando,
      accionesGestion,
      aplicarPostulacion,
      avanzarEstado,
      buscandoResumen,
      can,
      cargando,
      confirmar,
      detalle,
      editable,
      error,
      errorAccion,
      esAspirantePublicada,
      estadoPostulacion,
      hayAcciones,
      id,
      intento,
      irADocumentos,
      mostrarPanel,
      navigate,
      noPublicada,
      paso,
      puedeGestionar,
      setAccionando,
      setBuscandoResumen,
      setCargando,
      setDetalle,
      setError,
      setErrorAccion,
      setIntento,
      setNoPublicada,
      user,
      ventana,
    }
}
