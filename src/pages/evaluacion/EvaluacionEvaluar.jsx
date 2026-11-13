import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listaDocumentos } from '../../api/documentos'
import { obtenerEvaluacion, guardarEvaluacion } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import { abrirArchivoEnPestana, mensajeErrorBlob } from '../../api/postulacionesDocumentos'
import { IconoFlechaIzquierda } from '../../components/convocatorias/Iconos'
import AvatarIniciales from '../../components/evaluacion/AvatarIniciales'
import {
  EtiquetaConIcono,
  EtiquetaEvaluacion,
} from '../../components/evaluacion/PresentacionEvaluacion'
import RequisitoEvaluacion from '../../components/evaluacion/RequisitoEvaluacion'
import ResumenCumplimiento from '../../components/evaluacion/ResumenCumplimiento'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Cargando from '../../components/ui/Cargando'
import Mensaje, { MensajeAviso, MensajeError } from '../../components/ui/Mensaje'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import {
  CLASE_CAMPO,
  CLASE_TARJETA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'
import { repartirPesos } from '../../lib/evaluacion'

export default function EvaluacionEvaluar() {
  const { postulacionId } = useParams()
  const navigate = useNavigate()
  const confirmar = useConfirmacion()

  const [dato, setDato] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [errorDocumento, setErrorDocumento] = useState('')
  const [abriendo, setAbriendo] = useState(null)

  const [respuestas, setRespuestas] = useState({})
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)
  const botonBorrador = useRef(null)
  const botonCorregir = useRef(null)
  const botonFinalizar = useRef(null)

  // Solo los documentos OBLIGATORIOS y APLICABLES pesan en el cumplimiento. Es
  // la misma regla del backend: un documento opcional no resta y uno que "no
  // aplica" (la libreta militar de una mujer) se excluye. Los demás se listan
  // aparte, sin peso ni respuesta.
  const aplicables = documentos.filter((d) => d.obligatorio && d.estado !== 'no_aplica')
  const excluidos = documentos.filter((d) => !(d.obligatorio && d.estado !== 'no_aplica'))
  const pesos = repartirPesos(aplicables)

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
        // Sí/No en cada requisito.

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

  const total = aplicables.length
  const cumplidos = aplicables.filter((d) => respuestas[d.id] === true).length
  const sinResponder = aplicables.filter((d) => respuestas[d.id] == null).length
  const sinSubir = aplicables.filter((d) => d.estado === 'pendiente').length
  const pesoTotal = Object.values(pesos).reduce((acc, valor) => acc + valor, 0)
  const pesoObtenido = aplicables.reduce(
    (acc, d) => acc + (respuestas[d.id] === true ? (pesos[d.id] ?? 0) : 0),
    0,
  )
  const cumplimiento = pesoTotal > 0 ? Math.round((pesoObtenido / pesoTotal) * 100) : 0

  // Documentos que el aspirante reemplazó después de que se le pidió corregir.
  const actualizados = dato?.evaluacion?.documentos_actualizados ?? []
  const enCorreccion = dato?.evaluacion?.estado === 'correccion_solicitada'

  const guardar = async (estadoFinal) => {
    setError('')
    setGuardando(true)

    let guardada
    try {
      const res = await guardarEvaluacion(postulacionId, {
        observaciones: observaciones || null,
        estado: estadoFinal,
        criterios: [{ criterio: 'Evaluación', puntaje: cumplimiento, ponderacion: 1 }],
        perfil: respuestas,
        cumplimiento,
      })
      setDato(res.data)
      guardada = res.data.evaluacion
    } catch (err) {
      setError(mensajeError(err))
      return
    } finally {
      setGuardando(false)
    }

    // Con los botones ya habilitados: al cerrar el diálogo el foco vuelve al
    // que lo abrió, y un botón deshabilitado no puede recibirlo.
    const textos = {
      finalizada: {
        titulo: 'Evaluación finalizada',
        mensaje: `El resultado quedó guardado: ${guardada?.cumplimiento ?? cumplimiento} % de cumplimiento.`,
      },
      correccion_solicitada: {
        titulo: 'Solicitud enviada',
        mensaje:
          'Se notificó al aspirante para que corrija los documentos marcados con «No». La evaluación queda en espera de su respuesta.',
      },
      en_proceso: {
        titulo: 'Borrador guardado',
        mensaje:
          'Tus respuestas quedaron guardadas. La evaluación sigue en proceso y puedes retomarla cuando quieras.',
      },
    }[estadoFinal]
    const volver = await confirmar({
      ...textos,
      textoConfirmar: 'Volver al listado',
      textoCancelar: 'Seguir aquí',
    })
    if (volver) {
      navigate('/evaluacion')
      return
    }
    // Los botones se deshabilitaron mientras se guardaba y perdieron el foco.
    const boton =
      estadoFinal === 'finalizada'
        ? botonFinalizar
        : estadoFinal === 'correccion_solicitada'
          ? botonCorregir
          : botonBorrador
    setTimeout(() => boton.current?.focus(), 0)
  }

  const finalizar = async () => {
    const pendientes =
      sinResponder > 0
        ? ` ${sinResponder === 1 ? '1 requisito sin responder contará' : `${sinResponder} requisitos sin responder contarán`} como no cumplido.`
        : ''
    const continuar = await confirmar({
      titulo: '¿Finalizar la evaluación?',
      mensaje: `Se guardará el resultado con ${cumplimiento} % de cumplimiento (${cumplidos} de ${total} requisitos).${pendientes}`,
      textoConfirmar: 'Finalizar evaluación',
      textoCancelar: 'Seguir revisando',
    })
    if (continuar) guardar('finalizada')
  }

  const verDocumento = async (documento) => {
    setErrorDocumento('')
    setAbriendo(documento.id)
    try {
      await abrirArchivoEnPestana(
        `/revision/postulaciones/${postulacionId}/documentos/${documento.archivo.id}/archivo?inline=1`,
        { nombre: documento.archivo.nombre_original },
      )
    } catch (e) {
      setErrorDocumento((await mensajeErrorBlob(e)) || mensajeError(e))
    } finally {
      setAbriendo(null)
    }
  }

  const volverAlListado = (
    <Boton as={Link} to="/evaluacion" variante="fantasma" tamano="tactil" className="-ml-4 self-start">
      <IconoFlechaIzquierda className="h-4 w-4" />
      Volver al listado
    </Boton>
  )

  if (!postulacionId) {
    return (
      <div className="flex flex-col gap-4">
        <section className={`${CLASE_TARJETA} p-6`}>
          <h1 className={`text-xl font-bold ${CLASE_TEXTO_FUERTE}`}>Evaluación de aspirante</h1>
          <p className={`mt-2 text-sm ${CLASE_TEXTO_SUAVE}`}>Elige un aspirante en el listado para calificarlo.</p>
          <Boton as={Link} to="/evaluacion" tamano="tactil" className="mt-4">
            Ir al listado de aspirantes
          </Boton>
        </section>
      </div>
    )
  }

  if (cargando) {
    return (
      <div role="status">
        <Cargando>Cargando evaluación…</Cargando>
      </div>
    )
  }

  if (!dato) {
    return (
      <div className="flex flex-col gap-4">
        <MensajeError>{error || 'No se pudo cargar la postulación.'}</MensajeError>
        {volverAlListado}
      </div>
    )
  }

  const { aspirante, convocatoria, evaluacion } = dato

  return (
    <div className="flex flex-col gap-4">
      {volverAlListado}

      <header className={`${CLASE_TARJETA} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}>
        <div className="flex min-w-0 items-center gap-4">
          <span className="shrink-0 rounded-full dark:ring-1 dark:ring-sena-texto-suave/60">
            <AvatarIniciales nombre={aspirante.name} size="lg" />
          </span>
          <div className="min-w-0">
            <p className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Evaluación de aspirante</p>
            <h1
              className={`text-xl font-bold tracking-tight text-sena-azul dark:text-sena-texto sm:text-2xl ${CLASE_TEXTO_PARTIDO}`}
            >
              {aspirante.name}
            </h1>
            {aspirante.email && (
              <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_SUAVE}`}>{aspirante.email}</p>
            )}
            <p className={`mt-0.5 text-sm font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
              {convocatoria.titulo}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <EtiquetaEvaluacion evaluacion={evaluacion} />
          {evaluacion?.fecha && (
            <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Iniciada el {evaluacion.fecha}</span>
          )}
        </div>
      </header>

      {enCorreccion &&
        (actualizados.length > 0 ? (
          <Mensaje tipo="info">
            <strong>
              El aspirante ya reemplazó {actualizados.length}{' '}
              {actualizados.length === 1 ? 'documento' : 'documentos'}.
            </strong>{' '}
            Revisa los archivos marcados como «Corregido por el aspirante» y actualiza tu calificación.
          </Mensaje>
        ) : (
          <MensajeAviso>
            <strong>En espera de corrección del aspirante:</strong> se le pidió subsanar los documentos
            marcados con «No».
          </MensajeAviso>
        ))}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="xl:col-start-2 xl:row-start-1">
          <ResumenCumplimiento
            evaluacion={evaluacion}
            porcentaje={cumplimiento}
            cumplidos={cumplidos}
            total={total}
            sinResponder={sinResponder}
            sinSubir={sinSubir}
          />
        </div>

        <section
          aria-labelledby="requisitos-titulo"
          className={`${CLASE_TARJETA} flex flex-col gap-5 p-4 sm:p-5 xl:col-start-1 xl:row-start-1`}
        >
          <div>
            <h2 id="requisitos-titulo" className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>
              Requisitos del perfil
            </h2>
            <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>
              Abre cada documento y marca si cumple el requisito. Solo cuentan los documentos
              obligatorios y aplicables de la convocatoria.
            </p>
          </div>

          {errorDocumento && <MensajeError>{errorDocumento}</MensajeError>}

          {total === 0 ? (
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Sin documentos obligatorios aplicables.</p>
          ) : (
            <ul className="@container divide-y divide-sena-linea/70 dark:divide-sena-borde/50">
              {aplicables.map((documento) => (
                <RequisitoEvaluacion
                  key={documento.id}
                  documento={documento}
                  peso={pesos[documento.id]}
                  respuesta={respuestas[documento.id]}
                  actualizado={actualizados.includes(documento.id)}
                  onChange={(valor) => setRespuestas((prev) => ({ ...prev, [documento.id]: valor }))}
                  onVerDocumento={() => verDocumento(documento)}
                  abriendo={abriendo === documento.id}
                />
              ))}
            </ul>
          )}

          {excluidos.length > 0 && (
            <div className="border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
              <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>No cuentan en el cumplimiento</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {excluidos.map((documento) => (
                  <li
                    key={documento.id}
                    className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm ${CLASE_TEXTO_SUAVE}`}
                  >
                    <span className={`min-w-0 ${CLASE_TEXTO_PARTIDO}`}>{documento.nombre}</span>
                    <EtiquetaConIcono tono="neutral">
                      {documento.estado === 'no_aplica' ? 'No aplica' : 'Opcional'}
                    </EtiquetaConIcono>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Campo etiqueta="Observaciones">
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              maxLength={2000}
              className={`${CLASE_CAMPO} py-2`}
              placeholder="Escribe tus observaciones"
            />
          </Campo>

          {error && <MensajeError>{error}</MensajeError>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Boton
              ref={botonBorrador}
              variante="contorno"
              tamano="tactil"
              onClick={() => guardar('en_proceso')}
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar borrador'}
            </Boton>
            <Boton
              ref={botonCorregir}
              variante="contorno"
              tamano="tactil"
              onClick={() => guardar('correccion_solicitada')}
              disabled={guardando}
            >
              {guardando ? 'Enviando…' : 'Mandar a corregir'}
            </Boton>
            <Boton ref={botonFinalizar} tamano="tactil" onClick={finalizar} disabled={guardando} className="whitespace-normal!">
              {guardando ? 'Guardando…' : 'Finalizar y enviar resultado'}
            </Boton>
          </div>
        </section>
      </div>
    </div>
  )
}
