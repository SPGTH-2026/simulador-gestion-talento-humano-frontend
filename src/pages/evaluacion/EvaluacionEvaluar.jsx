import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { obtenerEvaluacion, guardarEvaluacion } from '../../api/evaluaciones'
import { listaDocumentos } from '../../api/documentos'
import { mensajeError } from '../../api/mensajeError'
import AvatarIniciales from '../../components/evaluacion/AvatarIniciales'
import BadgeEstado from '../../components/evaluacion/BadgeEstado'
import BarraProgreso from '../../components/evaluacion/BarraProgreso'
import ItemVerificacion from '../../components/evaluacion/ItemVerificacion'
import TarjetaResumen from '../../components/evaluacion/TarjetaResumen'

const CLASE_INPUT =
  'rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto'

const ETIQUETA_DOC = {
  validado: 'Validado',
  cargado: 'Pendiente',
  rechazado: 'Sin cargar',
}

export default function EvaluacionEvaluar() {
  const { postulacionId } = useParams()
  const navigate = useNavigate()

  const [dato, setDato] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [skills, setSkills] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const [respuestas, setRespuestas] = useState({})
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Items de verificación = documentos requeridos + skills/habilidades de la convocatoria.
  const items = [
    ...documentos.map((d) => ({
      id: d.id,
      titulo: d.nombre,
      requerido: 'Obligatorio',
      aspirante: d.estado === 'validado' ? 'Subido' : d.estado === 'cargado' ? 'Pendiente' : 'Sin cargar',
    })),
    ...skills.map((s) => ({
      id: s.id,
      titulo: `Habilidad: ${s.nombre}`,
      requerido: 'Declarada',
      aspirante: s.estado === 'validado' ? 'Con certificado' : 'Sin certificado',
    })),
  ]

  useEffect(() => {
    if (!postulacionId) return

    let vivo = true
    setCargando(true)

    Promise.all([obtenerEvaluacion(postulacionId), listaDocumentos(postulacionId)])
      .then(([ev, docs]) => {
        if (!vivo) return
        setDato(ev.data)
        setDocumentos(docs.data ?? [])
        setSkills(docs.skills ?? [])

        if (ev.data.evaluacion) {
          setObservaciones(ev.data.evaluacion.observaciones ?? '')
          setRespuestas(ev.data.evaluacion.perfil ?? {})
        }
        // Sin evaluación previa no se preselecciona nada: el evaluador decide
        // Sí/No en cada ítem.

        setError('')
      })
      .catch((e) => {
        if (vivo) setError(mensajeError(e))
      })
      .finally(() => {
        if (vivo) setCargando(false)
      })

    return () => {
      vivo = false
    }
  }, [postulacionId])

  const cumplidos = items.filter((it) => respuestas[it.id] === true).length
  const total = items.length
  const cumplimiento = total > 0 ? Math.round((cumplidos / total) * 100) : 0

  const guardar = async (estadoFinal) => {
    setError('')

    setGuardando(true)

    try {
      const res = await guardarEvaluacion(postulacionId, {
        observaciones: observaciones || null,
        estado: estadoFinal,
        criterios: [{ criterio: 'Evaluación', puntaje: cumplimiento, ponderacion: 1 }],
        perfil: respuestas,
        cumplimiento,
      })
      setDato(res.data)
      setModal({
        mensaje:
          estadoFinal === 'finalizada'
            ? 'Evaluación finalizada y guardada.'
            : 'Borrador guardado.',
      })
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  if (!postulacionId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-sena-borde dark:bg-sena-superficie">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">Evaluación de aspirante</h1>
        <p className="mt-2 text-slate-500 dark:text-sena-texto-suave">
          Elige un aspirante en el listado para calificarlo.
        </p>
        <Link
          to="/evaluacion"
          className="mt-4 inline-block rounded bg-sena-oscuro px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-azul"
        >
          Ir al listado de aspirantes
        </Link>
      </div>
    )
  }

  if (cargando) {
    return <p className="text-slate-500 dark:text-sena-texto-suave">Cargando…</p>
  }

  if (!dato) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error || 'No se pudo cargar la postulación.'}
        </p>
        <Link to="/evaluacion" className="text-sm font-medium text-sena-azul underline dark:text-sena-acento">
          Volver a la lista
        </Link>
      </div>
    )
  }

  const docsValidados = documentos.filter((d) => d.estado === 'validado').length

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/evaluacion"
            className="inline-flex items-center rounded bg-sena-azul px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-oscuro"
          >
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">Evaluación de aspirante</h1>
        </div>
      </div>

      {/* Tarjeta resumen azul oscuro del aspirante */}
      <div className="flex flex-col gap-4 rounded-xl bg-sena-azul p-5 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <AvatarIniciales nombre={dato.aspirante.name} size="lg" />
          <div className="flex flex-col gap-0.5">
            <p className="text-lg font-bold">{dato.aspirante.name}</p>
            <p className="text-sm opacity-90">{dato.aspirante.email}</p>
            <p className="text-xs opacity-75">Perfil técnico: Técnico en Sistemas</p>
            <p className="text-xs opacity-75">Convocatoria: {dato.convocatoria.titulo}</p>
            {dato.evaluacion?.fecha && (
              <p className="text-xs opacity-75">Fecha de evaluación: {dato.evaluacion.fecha}</p>
            )}
          </div>
        </div>
        <BadgeEstado estado={dato.evaluacion?.estado === 'finalizada' ? 'Completada' : 'En revisión'} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[30%_70%]">
        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Portafolio */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-sena-borde dark:bg-sena-superficie">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
              Portafolio
            </h2>
            {documentos.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-sena-texto-suave">Sin documentos cargados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {documentos.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-sena-texto">
                      <span aria-hidden="true">📄</span>
                      {doc.nombre}
                    </span>
                    <BadgeEstado estado={ETIQUETA_DOC[doc.estado] ?? doc.estado} />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-sena-texto-suave">
                <span>Documentos validados</span>
                <span className="font-medium">
                  {docsValidados}/{documentos.length}
                </span>
              </div>
              <BarraProgreso
                valor={docsValidados}
                max={documentos.length || 1}
                color={docsValidados === documentos.length && documentos.length > 0 ? 'bg-green-500' : 'bg-orange-500'}
              />
            </div>
          </div>

          {/* Información del aspirante */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-sena-borde dark:bg-sena-superficie">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
              Información del aspirante
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-sena-texto-suave">Formación</dt>
                <dd className="font-medium text-slate-800 dark:text-sena-texto">Técnico en Sistemas</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-sena-texto-suave">Experiencia</dt>
                <dd className="font-medium text-slate-800 dark:text-sena-texto">2 años</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-sena-texto-suave">Ciudad</dt>
                <dd className="font-medium text-slate-800 dark:text-sena-texto">Bogotá</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500 dark:text-sena-texto-suave">Postulación</dt>
                <dd className="font-medium text-slate-800 dark:text-sena-texto">{dato.convocatoria.titulo}</dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* Panel central */}
        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-sena-borde dark:bg-sena-superficie">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
            Lista de verificación de perfil
          </h2>

          {items.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-sena-texto-suave">Sin documentos cargados.</p>
          ) : (
            items.map((item) => (
              <ItemVerificacion
                key={item.id}
                titulo={item.titulo}
                requerido={item.requerido}
                aspirante={item.aspirante}
                respuesta={respuestas[item.id]}
                onChange={(v) => setRespuestas((prev) => ({ ...prev, [item.id]: v }))}
                onVerDocumento={() => window.alert(`Visualizando documento: ${item.titulo}`)}
              />
            ))
          )}

          <TarjetaResumen cumplidos={cumplidos} total={total} />

          <label className="flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto">
            Observaciones del evaluador sobre el perfil del aspirante...
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="4"
              className={CLASE_INPUT}
              placeholder="Observaciones del evaluador sobre el perfil del aspirante..."
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => guardar('en_proceso')}
              disabled={guardando}
              className="rounded border border-sena-azul/25 px-4 py-2 text-sm font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:opacity-60 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
            >
              {guardando ? 'Guardando…' : 'Guardar borrador'}
            </button>
            <button
              type="button"
              onClick={() => guardar('finalizada')}
              disabled={guardando}
              className="rounded bg-sena-oscuro px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-azul disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : 'Finalizar y enviar resultado'}
            </button>
          </div>
        </section>
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Modal de confirmación */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl dark:bg-sena-superficie">
            <p className="text-lg font-semibold text-slate-800 dark:text-sena-texto">{modal.mensaje}</p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded border border-sena-azul/25 px-4 py-2 text-sm font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModal(null)
                  navigate('/evaluacion')
                }}
                className="rounded bg-sena-oscuro px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-azul"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
