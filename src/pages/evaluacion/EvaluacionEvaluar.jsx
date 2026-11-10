import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { obtenerEvaluacion, guardarEvaluacion } from '../../api/evaluaciones'
import { listaDocumentos } from '../../api/documentos'
import { abrirArchivoEnPestana } from '../../api/postulacionesDocumentos'
import { mensajeError } from '../../api/mensajeError'
import AvatarIniciales from '../../components/evaluacion/AvatarIniciales'
import BadgeEstado from '../../components/evaluacion/BadgeEstado'
import BarraProgreso from '../../components/evaluacion/BarraProgreso'
import ItemVerificacion from '../../components/evaluacion/ItemVerificacion'
import TarjetaResumen from '../../components/evaluacion/TarjetaResumen'

const CLASE_INPUT =
  'rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto'

const ETIQUETA_DOC = {
  validado: 'Cargado',
  cargado: 'Pendiente',
  rechazado: 'Sin cargar',
  no_aplica: 'No aplica',
}

export default function EvaluacionEvaluar() {
  const { postulacionId } = useParams()
  const navigate = useNavigate()

  const [dato, setDato] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const [respuestas, setRespuestas] = useState({})
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Solo los documentos OBLIGATORIOS y APLICABLES pesan en el 60 %. Es la
  // misma regla del backend: un documento opcional no resta y un "no aplica"
  // (la libreta militar de una mujer) se excluye.
  const aplicables = documentos.filter((d) => d.obligatorio && d.estado !== 'no_aplica')

  // Peso (%) de cada documento aplicable. Si la convocatoria no configuró
  // porcentajes, todos valen lo mismo (reparto equitativo). Mismo criterio que
  // el backend: lo que el gestor no configuró se reparte con lo que sobra del
  // 100 %.
  const ponderado = aplicables.some((d) => d.ponderacion != null)
  const pesos = {}
  {
    const sinPeso = []
    let suma = 0
    aplicables.forEach((d) => {
      if (d.ponderacion == null) {
        sinPeso.push(d.id)
        return
      }
      pesos[d.id] = Number(d.ponderacion)
      suma += Number(d.ponderacion)
    })
    if (sinPeso.length > 0) {
      const cuota = Math.max(0, 100 - suma) / sinPeso.length
      sinPeso.forEach((id) => {
        pesos[id] = cuota
      })
    }
  }

  // Items de verificación = documentos obligatorios aplicables.
  const actualizados = dato?.evaluacion?.documentos_actualizados ?? []
  const items = aplicables.map((d) => ({
    id: d.id,
    titulo: d.nombre,
    requerido: 'Obligatorio',
    ponderacion: pesos[d.id],
    archivo: d.archivo,
    actualizado: actualizados.includes(d.id),
    aspirante: d.estado === 'validado' ? 'Subido' : d.estado === 'cargado' ? 'Pendiente' : 'Sin cargar',
  }))

  useEffect(() => {
    if (!postulacionId) return

    let vivo = true
    setCargando(true)

    Promise.all([obtenerEvaluacion(postulacionId), listaDocumentos(postulacionId)])
      .then(([ev, docs]) => {
        if (!vivo) return
        setDato(ev.data)
        setDocumentos(docs.data ?? [])

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
  const pesoTotal = Object.values(pesos).reduce((acc, valor) => acc + valor, 0)
  const pesoObtenido = items.reduce(
    (acc, it) => acc + (respuestas[it.id] === true ? (pesos[it.id] ?? 0) : 0),
    0,
  )
  const cumplimiento = pesoTotal > 0 ? Math.round((pesoObtenido / pesoTotal) * 100) : 0

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
      setModal(
        estadoFinal === 'finalizada'
          ? {
              titulo: 'Evaluación finalizada',
              descripcion: 'Los resultados se han guardado correctamente.',
            }
          : estadoFinal === 'correccion_solicitada'
            ? {
                titulo: 'Solicitud enviada',
                descripcion:
                  'Se ha notificado al aspirante para realizar las correcciones solicitadas.',
              }
            : {
                titulo: 'Borrador guardado',
                descripcion: 'La evaluación se ha guardado correctamente.',
              },
      )
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

  const docsValidados = aplicables.filter((d) => d.estado === 'validado').length

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
            <p className="text-xs opacity-75">Convocatoria: {dato.convocatoria.titulo}</p>
            {dato.evaluacion?.fecha && (
              <p className="text-xs opacity-75">Fecha de evaluación: {dato.evaluacion.fecha}</p>
            )}
          </div>
        </div>
        <BadgeEstado
          estado={
            dato.evaluacion?.estado === 'finalizada'
              ? 'Completada'
              : dato.evaluacion?.estado === 'correccion_solicitada'
                ? actualizados.length > 0
                  ? 'Corregido por revisar'
                  : 'En corrección'
                : 'En revisión'
          }
        />
      </div>

      {dato.evaluacion?.estado === 'correccion_solicitada' && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            actualizados.length > 0
              ? 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200'
              : 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
          }`}
        >
          {actualizados.length > 0 ? (
            <p>
              <strong>↻ El aspirante ya reemplazó {actualizados.length} documento(s).</strong> Revisa los archivos
              marcados como <em>Corregido por el aspirante</em> y actualiza tu calificación.
            </p>
          ) : (
            <p>
              <strong>En espera de corrección del aspirante:</strong> se solicitó subsanar los documentos marcados
              con «No».
            </p>
          )}
        </div>
      )}

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
                    <BadgeEstado
                      estado={
                        !doc.obligatorio
                          ? 'Opcional'
                          : (ETIQUETA_DOC[doc.estado] ?? doc.estado)
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600 dark:text-sena-texto-suave">
                <span>Documentos cargados</span>
                <span className="font-medium">
                  {docsValidados}/{aplicables.length}
                </span>
              </div>
              <BarraProgreso
                valor={docsValidados}
                max={aplicables.length || 1}
                color={docsValidados === aplicables.length && aplicables.length > 0 ? 'bg-green-500' : 'bg-orange-500'}
              />
              <p className="mt-2 text-[11px] text-slate-500 dark:text-sena-texto-suave">
                Solo cuentan los documentos obligatorios y aplicables de la convocatoria.
              </p>
            </div>
          </div>
        </aside>

        {/* Panel central */}
        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-sena-borde dark:bg-sena-superficie">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
            Lista de verificación de perfil
          </h2>

          {items.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-sena-texto-suave">Sin documentos obligatorios aplicables.</p>
          ) : (
            items.map((item) => (
              <ItemVerificacion
                key={item.id}
                titulo={item.titulo}
                requerido={item.requerido}
                ponderacion={item.ponderacion}
                aspirante={item.aspirante}
                actualizado={item.actualizado}
                respuesta={respuestas[item.id]}
                onChange={(v) => setRespuestas((prev) => ({ ...prev, [item.id]: v }))}
                onVerDocumento={
                  item.archivo?.id
                    ? () =>
                        abrirArchivoEnPestana(
                          `/revision/postulaciones/${postulacionId}/documentos/${item.archivo.id}/archivo?inline=1`,
                          { nombre: item.archivo.nombre_original },
                        ).catch((e) => setError(mensajeError(e)))
                    : undefined
                }
              />
            ))
          )}

          <TarjetaResumen
            cumplidos={cumplidos}
            total={total}
            porcentaje={cumplimiento}
            ponderado={ponderado}
            umbral={60}
          />

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

          <div className="flex flex-wrap justify-end gap-2">
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
              onClick={() => guardar('correccion_solicitada')}
              disabled={guardando}
              className="rounded border border-amber-500 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900"
            >
              {guardando ? 'Enviando…' : 'Mandar a corregir'}
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
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-sena-superficie">
            <div className="flex flex-col gap-1">
              <p className="text-lg font-bold text-slate-800 dark:text-sena-texto">{modal.titulo}</p>
              <p className="text-sm text-slate-500 dark:text-sena-texto-suave">{modal.descripcion}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
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
