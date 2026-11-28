import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { obtenerDatosPersonalesRevision } from '../../api/datosPersonales'
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
import {
  UMBRAL_CUMPLIMIENTO,
  calcularPuntaje,
  contarPendientes,
  formatearPorcentaje,
  hayNoCumple,
  resultadoDocumento,
} from '../../lib/evaluacion'

// Lógica de EvaluacionEvaluar: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useEvaluacionEvaluar() {
  const { postulacionId } = useParams()
  const navigate = useNavigate()
  const confirmar = useConfirmacion()

  const [dato, setDato] = useState(null)
  const [documentos, setDocumentos] = useState([])
  // Datos personales de la postulación (y de su representante si es menor). Si no se pueden leer, la evaluación sigue sin ellos.
  const [datosAspirante, setDatosAspirante] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const { abrir: abrirVisor, visor } = useVisorDocumento()

  const [respuestas, setRespuestas] = useState({})
  // Marcas de las habilidades de la convocatoria: «skill-{id}» → true cumple / false no cumple.
  const [skillMarcas, setSkillMarcas] = useState({})
  // Marcas del checklist de cada documento: «docitem-{documento}-{n}» → true cumple / false no cumple.
  const [itemMarcas, setItemMarcas] = useState({})
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)
  // Documento que se está calificando con su archivo al lado, y si el archivo se muestra ampliado.
  const [documentoActivoId, setDocumentoActivoId] = useState(null)
  const [ampliado, setAmpliado] = useState(false)
  const botonBorrador = useRef(null)
  const botonCorregir = useRef(null)
  const botonFinalizar = useRef(null)

  // Solo los documentos OBLIGATORIOS y APLICABLES pesan en el cumplimiento. Es
  // la misma regla del backend: un documento opcional no resta y uno que "no
  // aplica" (la libreta militar de una mujer) se excluye. Los demás se listan
  // aparte, sin peso ni respuesta.
  const aplicables = documentos.filter((d) => d.obligatorio && d.estado !== 'no_aplica')
  const excluidos = documentos.filter((d) => !(d.obligatorio && d.estado !== 'no_aplica'))
  // Obligatorios aplicables que el aspirante no ha cargado. El servidor no deja marcarlos «Cumple» ni finalizar con
  // alguno faltante; sí deja guardar un borrador y pedir la corrección con el faltante marcado «No cumple».
  const faltantes = aplicables.filter((d) => d.estado === 'pendiente')

  useEffect(() => {
    if (!postulacionId) return

    let vivo = true
    setCargando(true)

    Promise.all([
      obtenerEvaluacion(postulacionId),
      listaDocumentos(postulacionId),
      obtenerDatosPersonalesRevision(postulacionId).catch(() => null),
    ])
      .then(([ev, docs, personales]) => {
        if (!vivo) return
        setDato(ev.data)
        setDocumentos(docs.data ?? [])
        setDatosAspirante(personales)

        if (ev.data.evaluacion) {
          setObservaciones(ev.data.evaluacion.observaciones ?? '')
          // Una evaluación anterior pudo dejar «Cumple» en un documento que hoy no tiene archivo: ese valor es inválido
          // para el servidor y no se reenvía. No se reemplaza por «No cumple»: queda sin responder y lo decide el evaluador.
          const perfil = { ...(ev.data.evaluacion.perfil ?? {}) }
          // Las marcas de habilidades y de ítems tienen su propio estado: no se mezclan con las de documentos.
          for (const k of Object.keys(perfil)) if (/^(req-|reqdoc-|skill-|docitem-)/.test(k)) delete perfil[k]
          for (const d of docs.data ?? []) {
            if (d.obligatorio && d.estado === 'pendiente' && perfil[d.id] === true) delete perfil[d.id]
          }
          setRespuestas(perfil)
          setSkillMarcas(Object.fromEntries(Object.entries(ev.data.evaluacion.perfil ?? {}).filter(([k]) => k.startsWith('skill-'))))
          setItemMarcas(Object.fromEntries(Object.entries(ev.data.evaluacion.perfil ?? {}).filter(([k]) => k.startsWith('docitem-'))))
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

  // Habilidades que la convocatoria pide y el aspirante DECLARÓ: solo esas se califican y suman. Una no declarada no aparece.
  const habilidades = (dato?.skills ?? []).filter((s) => s.declarada)
  const puntos = dato?.puntos ?? null
  const calculo = { aplicables, respuestas, itemMarcas, habilidades, skillMarcas }

  const total = aplicables.length
  const cumplidos = aplicables.filter((d) => resultadoDocumento(d, respuestas, itemMarcas) === true).length
  const sinResponder = aplicables.filter((d) => d.estado !== 'pendiente' && resultadoDocumento(d, respuestas, itemMarcas) == null).length
  const sinCargar = faltantes.length
  // Mismo cálculo que el servidor: documentos 90 puntos, habilidades declaradas 10 (100 de documentos si no hay habilidades).
  const puntaje = calcularPuntaje({ ...calculo, puntos })
  const cumplimiento = puntaje.total
  // Lo que falta calificar antes de poder finalizar (ítems, documentos sin checklist y habilidades declaradas).
  const pendientes = contarPendientes(calculo)
  const algunNoCumple = hayNoCumple(calculo)
  const faltaObservacion = algunNoCumple && observaciones.trim() === ''

  // Documentos que el aspirante reemplazó después de que se le pidió corregir.
  const actualizados = dato?.evaluacion?.documentos_actualizados ?? []
  const enCorreccion = dato?.evaluacion?.estado === 'correccion_solicitada'
  // Una evaluación finalizada es un resultado: se ve en solo lectura. Solo se puede volver a calificar si se reabrió porque el
  // aspirante cambió un documento.
  const soloLectura = dato?.evaluacion?.estado === 'finalizada' && !dato?.evaluacion?.reabierta
  // Se pidió corregir y el aspirante todavía está dentro de su plazo sin responder: no hay nada que el evaluador deba hacer. Se
  // calcula con la ronda de corrección vigente; cuando el aspirante responde o el plazo vence, vuelven las acciones.
  const esperandoAspirante = dato?.evaluacion?.estado === 'correccion_solicitada' && dato?.evaluacion?.correccion_estado === 'vigente'
  // Rondas de corrección de la POSTULACIÓN (compartidas entre evaluadores): las reglas las aplica el servidor y la pantalla
  // solo explica por qué «Enviar a corrección» está disponible o bloqueado (ver PanelRondasCorreccion).
  const correccion = dato?.correccion ?? null
  const puedePedirCorreccion = correccion ? Boolean(correccion.puede_solicitar) : true
  // Documentos con algún «No cumple». Si el cumplimiento no alcanza el mínimo y la corrección todavía puede seguir, no se
  // finaliza: se le da al aspirante la oportunidad de corregir. Con el mínimo alcanzado se puede finalizar aunque algo no cumpla.
  const noCumple = aplicables.filter((d) => resultadoDocumento(d, respuestas, itemMarcas) === false)
  // Las correcciones se agotaron: no quedan rondas (plazo vencido sin respuesta o las dos ordinarias usadas) y el
  // evaluador no puede pedir otra. Solo entonces se puede finalizar por debajo del mínimo con un documento «No cumple».
  const correccionAgotada = Boolean(correccion) && !correccion.puede_solicitar
    && ['agotadas', 'vencida'].includes(correccion.motivo)
  const bloqueoPorNoCumple = noCumple.length > 0 && cumplimiento < UMBRAL_CUMPLIMIENTO && !correccionAgotada
  const bloqueoFinalizar = soloLectura || esperandoAspirante || faltantes.length > 0 || pendientes > 0 || faltaObservacion || bloqueoPorNoCumple

  const documentoActivo = aplicables.find((d) => d.id === documentoActivoId) ?? null
  const rutaDocumento = (documento) =>
    documento?.archivo ? `/revision/postulaciones/${postulacionId}/documentos/${documento.archivo.id}/archivo?inline=1` : null

  const abrirDocumento = (documento) => {
    setDocumentoActivoId(documento.id)
    // Con el panel ya pintado, se lleva a la vista (en pantallas estrechas queda debajo de la lista).
    setTimeout(() => document.getElementById('panel-calificar-documento')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }), 0)
  }
  const cerrarDocumento = () => {
    setDocumentoActivoId(null)
    setAmpliado(false)
  }

  // «Cumple» / «No cumple» de un documento SIN checklist. Con checklist se califica ítem por ítem y el documento se deduce.
  const marcarDocumento = (documento, valor) => setRespuestas((prev) => ({ ...prev, [documento.id]: valor }))

  const guardar = async (estadoFinal) => {
    setError('')
    setGuardando(true)

    // El resultado de cada documento sale de su checklist (o de su propio Cumple / No cumple). Por seguridad, aunque el
    // formulario no lo permita, nunca viaja «Cumple» de un documento sin archivo.
    const faltanIds = new Set(faltantes.map((d) => d.id))
    const perfilDocumentos = {}
    for (const d of aplicables) {
      const resultado = resultadoDocumento(d, respuestas, itemMarcas)
      if (resultado === undefined || (resultado === true && faltanIds.has(d.id))) continue
      perfilDocumentos[d.id] = resultado
    }
    const idsHabilidades = new Set(habilidades.map((s) => `skill-${s.id}`))
    const perfil = {
      ...perfilDocumentos,
      ...Object.fromEntries(Object.entries(skillMarcas).filter(([clave]) => idsHabilidades.has(clave))),
      ...itemMarcas,
    }

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

    // Al finalizar no se queda en la pantalla: el resultado es definitivo y se vuelve al listado (un solo botón, sin «Seguir aquí»).
    if (estadoFinal === 'finalizada') {
      await confirmar({
        titulo: 'Evaluación finalizada',
        mensaje: `El resultado quedó guardado: ${formatearPorcentaje(guardada?.cumplimiento ?? cumplimiento)} de cumplimiento.`,
        textoConfirmar: 'Volver al listado',
        textoCancelar: null,
      })
      navigate('/evaluacion')
      return
    }

    // Con los botones ya habilitados: al cerrar el diálogo el foco vuelve al
    // que lo abrió, y un botón deshabilitado no puede recibirlo.
    const textos = {
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
    const boton = estadoFinal === 'correccion_solicitada' ? botonCorregir : botonBorrador
    setTimeout(() => boton.current?.focus(), 0)
  }

  const finalizar = async () => {
    if (bloqueoFinalizar) return // el botón ya está desactivado
    const continuar = await confirmar({
      titulo: '¿Finalizar la evaluación?',
      mensaje: `Se guardará el resultado con ${formatearPorcentaje(cumplimiento)} de cumplimiento (${cumplidos} de ${total} documentos cumplen). Después no podrás cambiarlo.`,
      textoConfirmar: 'Finalizar evaluación',
      textoCancelar: 'Seguir revisando',
    })
    if (continuar) guardar('finalizada')
  }

  // Certificado que el aspirante subió para una habilidad que declaró (id de la declaración: postulacion_skill_id).
  // Se muestra en el visor interno.
  const verCertificado = (habilidad) =>
    abrirVisor(`/revision/postulaciones/${postulacionId}/skills/${habilidad.postulacion_skill_id}/certificado/archivo?inline=1`, {
      titulo: `${habilidad.nombre} - certificado`,
      nombre: `${habilidad.nombre} - certificado`,
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
    abrirDocumento,
    actualizados,
    ampliado,
    aplicables,
    aspirante,
    algunNoCumple,
    botonBorrador,
    botonCorregir,
    botonFinalizar,
    bloqueoFinalizar,
    bloqueoPorNoCumple,
    cargando,
    cerrarDocumento,
    convocatoria,
    correccion,
    cumplidos,
    cumplimiento,
    dato,
    datosAspirante,
    documentoActivo,
    documentos,
    enCorreccion,
    error,
    esperandoAspirante,
    evaluacion,
    excluidos,
    faltaObservacion,
    faltantes,
    finalizar,
    guardando,
    guardar,
    habilidades,
    itemMarcas,
    marcarDocumento,
    noCumple,
    observaciones,
    pendientes,
    postulacionId,
    puedePedirCorreccion,
    puntaje,
    puntos,
    respuestas,
    rutaDocumento,
    setAmpliado,
    setDato,
    setItemMarca: (clave, valor) =>
      setItemMarcas((prev) => {
        const siguiente = { ...prev }
        if (valor === undefined) delete siguiente[clave]
        else siguiente[clave] = valor
        return siguiente
      }),
    setObservaciones,
    setSkillMarca: (id, valor) =>
      setSkillMarcas((prev) => {
        const siguiente = { ...prev }
        if (valor === undefined) delete siguiente[`skill-${id}`]
        else siguiente[`skill-${id}`] = valor
        return siguiente
      }),
    sinCargar,
    sinResponder,
    skillMarcas,
    soloLectura,
    total,
    verCertificado,
    visor,
    volverAlListado,
  }
}
