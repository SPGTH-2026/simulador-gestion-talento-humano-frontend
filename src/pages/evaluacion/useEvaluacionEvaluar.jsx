import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listaDocumentos } from '../../api/documentos'
import { obtenerEvaluacion, guardarEvaluacion } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import { IconoFlechaIzquierda } from '../../components/convocatorias/Iconos'
import Boton from '../../components/ui/Boton'
import { EsqueletoDetalle } from '../../components/ui/Esqueleto'
import { MensajeError } from '../../components/ui/Mensaje'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import useVisorDocumento from '../../hooks/useVisorDocumento'
import { CLASE_TARJETA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { repartirPesos } from '../../lib/evaluacion'

// Lógica de EvaluacionEvaluar: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useEvaluacionEvaluar() {
  const { postulacionId } = useParams()
  const navigate = useNavigate()
  const confirmar = useConfirmacion()

  const [dato, setDato] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const { abrir: abrirVisor, visor } = useVisorDocumento()

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
  // Obligatorios aplicables que el aspirante no ha cargado. El servidor no deja marcarlos «Cumple» ni finalizar con
  // alguno faltante; sí deja guardar un borrador y pedir la corrección con el faltante marcado «No cumple».
  const faltantes = aplicables.filter((d) => d.estado === 'pendiente')

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
          // Una evaluación anterior pudo dejar «Cumple» en un documento que hoy no tiene archivo: ese valor es inválido
          // para el servidor y no se reenvía. No se reemplaza por «No cumple»: queda sin responder y lo decide el evaluador.
          const perfil = { ...(ev.data.evaluacion.perfil ?? {}) }
          for (const d of docs.data ?? []) {
            if (d.obligatorio && d.estado === 'pendiente' && perfil[d.id] === true) delete perfil[d.id]
          }
          setRespuestas(perfil)
        }
        // Sin evaluación previa no se preselecciona nada: el evaluador decide
        // Cumple / No cumple en cada requisito.

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
  const sinCargar = faltantes.length
  const pesoTotal = Object.values(pesos).reduce((acc, valor) => acc + valor, 0)
  const pesoObtenido = aplicables.reduce(
    (acc, d) => acc + (respuestas[d.id] === true ? (pesos[d.id] ?? 0) : 0),
    0,
  )
  const cumplimiento = pesoTotal > 0 ? Math.round((pesoObtenido / pesoTotal) * 100) : 0

  // Documentos que el aspirante reemplazó después de que se le pidió corregir.
  const actualizados = dato?.evaluacion?.documentos_actualizados ?? []
  const enCorreccion = dato?.evaluacion?.estado === 'correccion_solicitada'
  // Rondas de corrección de la POSTULACIÓN (compartidas entre evaluadores): las reglas las aplica el servidor y la pantalla
  // solo explica por qué «Enviar a corrección» está disponible o bloqueado (ver PanelRondasCorreccion).
  const correccion = dato?.correccion ?? null
  const puedePedirCorreccion = correccion ? Boolean(correccion.puede_solicitar) : true
  // Documentos marcados «No cumple». Mientras haya alguno y la corrección todavía pueda seguir, no se finaliza: si se
  // finaliza, el aspirante queda con un documento sin corregir y la selección usaría esa evaluación.
  const noCumple = aplicables.filter((d) => respuestas[d.id] === false)
  // Las correcciones se agotaron: no quedan rondas (plazo vencido sin respuesta o las dos ordinarias usadas) y el
  // evaluador no puede pedir otra. Solo entonces se puede finalizar con un documento «No cumple».
  const correccionAgotada = Boolean(correccion) && !correccion.puede_solicitar
    && ['agotadas', 'vencida'].includes(correccion.motivo)
  const bloqueoPorNoCumple = noCumple.length > 0 && !correccionAgotada
  const bloqueoFinalizar = faltantes.length > 0 || bloqueoPorNoCumple

  const guardar = async (estadoFinal) => {
    setError('')
    setGuardando(true)

    // Por seguridad, aunque el formulario no lo permita, nunca viaja «Cumple» de un documento sin archivo.
    const faltanIds = new Set(faltantes.map((d) => d.id))
    const perfil = Object.fromEntries(
      Object.entries(respuestas).filter(([id, valor]) => !(valor === true && faltanIds.has(id))),
    )

    let guardada
    try {
      const res = await guardarEvaluacion(postulacionId, {
        observaciones: observaciones || null,
        estado: estadoFinal,
        criterios: [{ criterio: 'Evaluación', puntaje: cumplimiento, ponderacion: 1 }],
        perfil,
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
          'Se notificó al aspirante para que corrija los documentos marcados con «No cumple». La evaluación queda en espera de su respuesta.',
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
    if (bloqueoFinalizar) return // el botón ya está desactivado
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

  // El visor interno muestra la carga y los errores; no se abre otra pestaña.
  const verDocumento = (documento) =>
    abrirVisor(`/revision/postulaciones/${postulacionId}/documentos/${documento.archivo.id}/archivo?inline=1`, {
      titulo: documento.nombre || documento.archivo.nombre_original,
      nombre: documento.archivo.nombre_original,
    })

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
    // «Volver al listado» no depende de la API: se ve mientras carga y el esqueleto sustituye solo el contenido.
    return (
      <div className="flex flex-col gap-4">
        {volverAlListado}
        <EsqueletoDetalle texto="Cargando evaluación…" bloques={3} />
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

    return {
      actualizados,
      aplicables,
      aspirante,
      botonBorrador,
      botonCorregir,
      botonFinalizar,
      cargando,
      confirmar,
      convocatoria,
      cumplidos,
      correccion,
      cumplimiento,
      dato,
      documentos,
      enCorreccion,
      error,
      evaluacion,
      excluidos,
      bloqueoFinalizar,
      bloqueoPorNoCumple,
      faltantes,
      finalizar,
      guardando,
      noCumple,
      guardar,
      puedePedirCorreccion,
      navigate,
      observaciones,
      pesoObtenido,
      pesoTotal,
      pesos,
      postulacionId,
      respuestas,
      setCargando,
      setDato,
      setDocumentos,
      setError,
      setGuardando,
      setObservaciones,
      setRespuestas,
      sinCargar,
      sinResponder,
      total,
      verDocumento,
      visor,
      volverAlListado,
    }
}
