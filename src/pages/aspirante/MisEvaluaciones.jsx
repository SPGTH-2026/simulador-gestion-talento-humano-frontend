import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { misEvaluaciones } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import client from '../../api/client'
import { IconoOjo, IconoX } from '../../components/convocatorias/Iconos'
import {
  DatosAspirante,
  EtiquetaConIcono,
  EtiquetaEvaluacion,
  Puntaje,
  Resultado,
} from '../../components/evaluacion/PresentacionEvaluacion'
import Boton from '../../components/ui/Boton'
import Cargando from '../../components/ui/Cargando'
import Dialogo from '../../components/ui/Dialogo'
import Icono from '../../components/ui/Icono'
import { MensajeAviso, MensajeError } from '../../components/ui/Mensaje'
import {
  CLASE_CAJA_SUAVE,
  CLASE_SUBTITULO_PAGINA,
  CLASE_TARJETA,
  CLASE_TARJETA_PLANA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'
import { ESTADO_DOCUMENTO, formatearPeso } from '../../lib/evaluacion'

// El contrato puede traer el aspirante como texto o como objeto.
const datosAspirante = (e) =>
  typeof e.aspirante === 'string' ? { name: e.aspirante } : (e.aspirante ?? { name: '—' })

// El evaluador puede venir como texto o como objeto ({ name, email }).
const nombreEvaluador = (e) =>
  typeof e.evaluador === 'string' ? e.evaluador : e.evaluador?.name || e.evaluador?.email || null

function Dato({ etiqueta, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5">
      <dt className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{etiqueta}</dt>
      <dd className={`text-sm font-medium ${CLASE_TEXTO_FUERTE}`}>{children}</dd>
    </div>
  )
}

function TituloBloque({ children }) {
  return <h3 className={`mb-2 text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>{children}</h3>
}

function TarjetaEvaluacion({ evaluacion, onVerDetalle }) {
  return (
    <li className={`${CLASE_TARJETA_PLANA} flex min-w-0 flex-col gap-4 p-4`}>
      <DatosAspirante aspirante={datosAspirante(evaluacion)} tamano="md" />
      <p className={`text-sm font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
        {evaluacion.convocatoria?.titulo ?? '—'}
      </p>
      {nombreEvaluador(evaluacion) && (
        <p className={`-mt-2 text-xs ${CLASE_TEXTO_SUAVE}`}>Evaluador: {nombreEvaluador(evaluacion)}</p>
      )}

      <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-6 gap-y-2 border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
        <div>
          <dt className={`mb-1 text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Puntaje</dt>
          <dd>
            <Puntaje evaluacion={evaluacion} />
          </dd>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <dt className="sr-only">Evaluación</dt>
          <dd className="flex flex-wrap items-center justify-end gap-2">
            <EtiquetaEvaluacion evaluacion={evaluacion} />
            <Resultado evaluacion={evaluacion} />
          </dd>
        </div>
      </dl>

      <Boton variante="contorno" tamano="tactil" onClick={onVerDetalle} className="mt-auto w-full">
        <IconoOjo className="h-4 w-4" />
        Ver detalle
      </Boton>
    </li>
  )
}

// Lo que el evaluador decidió sobre un documento. Un «No» pide corregirlo; si el
// aspirante ya lo reemplazó, queda a la espera de que el evaluador lo revise.
function DecisionDocumento({ decision, reemplazado }) {
  if (decision === true) {
    return (
      <EtiquetaConIcono tono="exito" icono={<Icono nombre="check" className="size-3.5" />}>
        Cumple
      </EtiquetaConIcono>
    )
  }
  if (decision !== false) return null
  return reemplazado ? (
    <EtiquetaConIcono tono="azul" icono={<Icono nombre="reintentar" className="size-3.5" />}>
      Corregido (en revisión)
    </EtiquetaConIcono>
  ) : (
    <EtiquetaConIcono tono="peligro" icono={<IconoX className="size-3.5" />}>
      Corregir
    </EtiquetaConIcono>
  )
}

function DetalleEvaluacion({ evaluacion, documentos, estadoDocumentos, onCerrar }) {
  const completada = evaluacion.estado === 'finalizada'
  const actualizados = evaluacion.documentos_actualizados ?? []
  const aspirante = datosAspirante(evaluacion)

  return (
    <Dialogo idTitulo="detalle-titulo" onCerrar={onCerrar} className="max-w-lg p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="detalle-titulo" className={`text-lg font-bold ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
            {aspirante.name}
          </h2>
          <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_SUAVE}`}>
            {evaluacion.convocatoria?.titulo}
          </p>
          {nombreEvaluador(evaluacion) && (
            <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Evaluador: {nombreEvaluador(evaluacion)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
          className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-slate-600 transition-colors hover:bg-sena-hundido hover:text-sena-azul motion-reduce:transition-none dark:text-sena-texto-suave dark:hover:bg-white/10 dark:hover:text-white"
        >
          <IconoX />
        </button>
      </div>

      <dl className="mt-3 divide-y divide-sena-linea/70 dark:divide-sena-borde/50">
        <Dato etiqueta="Evaluación">
          <EtiquetaEvaluacion evaluacion={evaluacion} />
        </Dato>
        <Dato etiqueta="Resultado">
          <Resultado evaluacion={evaluacion} />
        </Dato>
        <Dato etiqueta="Puntaje total">
          <Puntaje evaluacion={evaluacion} />
        </Dato>
        <Dato etiqueta={completada ? 'Cumplimiento' : 'Cumplimiento provisional'}>
          {evaluacion.cumplimiento != null ? `${evaluacion.cumplimiento} %` : '—'}
        </Dato>
        {evaluacion.fecha && <Dato etiqueta="Iniciada el">{evaluacion.fecha}</Dato>}
      </dl>

      <div className="mt-4">
        <TituloBloque>Documentos</TituloBloque>
        {estadoDocumentos === 'cargando' ? (
          <Cargando>Cargando documentos…</Cargando>
        ) : estadoDocumentos === 'error' ? (
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>No se pudieron cargar los documentos.</p>
        ) : documentos.length === 0 ? (
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Esta convocatoria no pide documentos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documentos.map((d) => {
              const estado = ESTADO_DOCUMENTO[d.estado] ?? ESTADO_DOCUMENTO.pendiente
              return (
                <li key={d.id ?? d.nombre} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 text-sm">
                  <span className={`min-w-0 ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{d.nombre}</span>
                  <span className="flex min-w-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
                    {d.ponderacion != null && (
                      <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Peso {formatearPeso(d.ponderacion)}</span>
                    )}
                    <DecisionDocumento
                      decision={evaluacion.perfil?.[d.id]}
                      reemplazado={actualizados.includes(d.id)}
                    />
                    <EtiquetaConIcono
                      tono={estado.tono}
                      icono={d.estado === 'subido' ? <Icono nombre="check" className="size-3.5" /> : null}
                    >
                      {estado.texto}
                    </EtiquetaConIcono>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {evaluacion.criterios?.length > 0 && (
        <div className="mt-4">
          <TituloBloque>Criterios</TituloBloque>
          <ul className="flex flex-col gap-1">
            {evaluacion.criterios.map((c) => (
              <li key={c.criterio} className={`flex justify-between gap-3 text-sm ${CLASE_TEXTO_FUERTE}`}>
                <span>{c.criterio}</span>
                <span className="font-medium tabular-nums">{c.puntaje}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {evaluacion.observaciones && (
        <div className="mt-4">
          <TituloBloque>Observaciones</TituloBloque>
          <p className={`${CLASE_CAJA_SUAVE} p-3 text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
            {evaluacion.observaciones}
          </p>
        </div>
      )}

      {evaluacion.estado === 'correccion_solicitada' && (
        <MensajeAviso className="mt-4 flex flex-col items-start gap-2">
          <span>
            <strong>El evaluador pidió corregir</strong> los documentos marcados con «Corregir».
          </span>
          {evaluacion.postulacion_id && (
            <Boton
              as={Link}
              to={`/postulaciones/${evaluacion.postulacion_id}/documentos`}
              onClick={onCerrar}
              variante="contorno"
              tamano="tactil"
            >
              Ir a corregir mis documentos
            </Boton>
          )}
        </MensajeAviso>
      )}

      <Boton tamano="tactil" onClick={onCerrar} className="mt-5 w-full">
        Cerrar
      </Boton>
    </Dialogo>
  )
}

export default function MisEvaluaciones() {
  const { can } = useAuth()
  const [evaluaciones, setEvaluaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [detalle, setDetalle] = useState(null)
  const [documentos, setDocumentos] = useState([])
  // 'cargando' | 'listo' | 'error': los documentos del detalle.
  const [estadoDocumentos, setEstadoDocumentos] = useState('listo')

  const cargar = useCallback(
    () =>
      misEvaluaciones()
        .then((res) => {
          setEvaluaciones(res.data)
          setError('')
        })
        .catch((e) => setError(mensajeError(e)))
        .finally(() => setCargando(false)),
    [],
  )

  useEffect(() => {
    cargar()
  }, [cargar])

  // Refresco automático: el instructor o super admin ve las evaluaciones nuevas
  // de los evaluadores sin recargar. Es silencioso (no vuelve a mostrar la
  // carga) y solo corre con la pestaña a la vista.
  useEffect(() => {
    const actualizar = () => {
      if (document.visibilityState === 'visible') cargar()
    }
    const intervalo = setInterval(actualizar, 10000)
    document.addEventListener('visibilitychange', actualizar)
    window.addEventListener('focus', actualizar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', actualizar)
      window.removeEventListener('focus', actualizar)
    }
  }, [cargar])

  const reintentar = () => {
    setCargando(true)
    setError('')
    cargar()
  }

  const verDetalle = async (e) => {
    setDetalle(e)
    setDocumentos([])
    if (!e?.postulacion_id) {
      setEstadoDocumentos('listo')
      return
    }
    setEstadoDocumentos('cargando')
    const url = can('documentos:ver')
      ? `/revision/postulaciones/${e.postulacion_id}/documentos`
      : `/postulaciones/${e.postulacion_id}/documentos`
    try {
      const res = await client.get(url)
      const payload = res.data?.data ?? res.data ?? {}
      setDocumentos(
        (payload.documentos ?? [])
          .filter((d) => d.parametro?.nombre)
          .map((d) => ({
            id: `doc-${d.parametro.id}`,
            nombre: d.parametro.nombre,
            // Peso del documento en esta convocatoria (null = sin configurar).
            ponderacion: d.ponderacion != null ? Number(d.ponderacion) : null,
            estado: d.estado,
          })),
      )
      setEstadoDocumentos('listo')
    } catch {
      setEstadoDocumentos('error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className={CLASE_TITULO_PAGINA}>Mis evaluaciones</h1>
        <p className={CLASE_SUBTITULO_PAGINA}>Consulta el estado y el resultado de cada evaluación.</p>
      </div>

      {error && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError className="w-full">{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      {cargando ? (
        <div role="status">
          <Cargando>Cargando evaluaciones…</Cargando>
        </div>
      ) : (
        evaluaciones.length === 0 &&
        !error && (
          <section className={`${CLASE_TARJETA} flex flex-col items-center gap-2 px-6 py-12 text-center`}>
            <Icono nombre="evaluaciones" className="size-8 text-slate-500 dark:text-sena-texto-suave" />
            <h2 className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no tienes evaluaciones registradas</h2>
            <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
              Cuando haya una evaluación, aquí verás su estado y su resultado.
            </p>
          </section>
        )
      )}

      {!cargando && evaluaciones.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {evaluaciones.map((e) => (
            <TarjetaEvaluacion key={e.id} evaluacion={e} onVerDetalle={() => verDetalle(e)} />
          ))}
        </ul>
      )}

      {detalle && (
        <DetalleEvaluacion
          evaluacion={detalle}
          documentos={documentos}
          estadoDocumentos={estadoDocumentos}
          onCerrar={() => setDetalle(null)}
        />
      )}
    </div>
  )
}
