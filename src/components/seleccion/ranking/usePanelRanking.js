import { useSeleccionRanking } from './useSeleccionRanking'
import { useObjetivoRanking } from './useObjetivoRanking'
import { useEffect, useRef, useState } from 'react'
import { rankingConvocatoria } from '../../../api/seleccion'
import { mensajeError } from '../../../api/mensajeError'
import useAvisoTransitorio from '../../../hooks/useAvisoTransitorio'

// Lógica de PanelRanking: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function usePanelRanking({ convocatoriaId, activo = true, enProceso, puedeDecidir, comparacion, onConfirmada }) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })
  const [intento, setIntento] = useState(0)
  const [abierta, setAbierta] = useState(activo)
  if (activo && !abierta) setAbierta(true)
  const [seleccion, setSeleccion] = useState(() => new Map())
  // El ranking cambió desde que se empezó a elegir: hay que revisar antes de confirmar de nuevo.
  const [desactualizado, setDesactualizado] = useState(false)
  // Resultado de la última acción de elección. Se muestra pegado a la barra de elección, donde se actúa.
  const [aviso, setAviso] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [revision, setRevision] = useState(false)
  // Justificación escrita en el diálogo: vive aquí para sobrevivir al cierre del diálogo (409) y a un 422.
  const [borrador, setBorrador] = useState('')

  // Las confirmaciones breves de éxito se retiran solas a los pocos segundos (el objetivo y la elección quedan igual).
  // Los avisos que requieren atención y los errores NO: siguen visibles hasta la siguiente acción.
  const avisoTransitorio = aviso && (aviso.tipo === 'exito' || aviso.tipo === 'info') ? aviso : null
  const objetivo = useObjetivoRanking({ convocatoriaId, meta, recargar, montado, botonCambiar })
  const { abrirObjetivo, avisoObjetivo, cerrarObjetivo, errorObjetivo, guardandoObjetivo, guardarObjetivo, objetivoActual, objetivoCambio, objetivoNumero, objetivoTexto, objetivoValido, pausaObjetivo, setAvisoObjetivo, setErrorObjetivo, setGuardandoObjetivo, setObjetivoTexto, textoObjetivo } = objetivo
  const pausaAviso = useAvisoTransitorio(avisoTransitorio, () => setAviso(null))

  const montado = useRef(true)
  const versionVista = useRef(null)
  const seleccionados = useRef(0)
  const seleccionActual = useRef(new Map())
  const paginaActual = useRef(1)
  const intentoActual = useRef(0)
  const borradorActual = useRef('')
  const cargadoClave = useRef(null)
  const sugeridosEnCache = useRef({ version: null, ids: null })
  const mensajeRef = useRef(null)
  const botonCambiar = useRef(null)

  useEffect(() => {
    seleccionados.current = seleccion.size
    seleccionActual.current = seleccion
    paginaActual.current = pagina
    intentoActual.current = intento
    borradorActual.current = borrador
  }, [seleccion, pagina, intento, borrador])

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  useEffect(() => {
    if (!abierta || !activo) return undefined
    const clave = `${pagina}|${intento}`
    // Sin atajo por «ya cargada»: si el usuario vuelve a una página mientras otra pedida aún no llega, esa petición se
    // descarta (vigente=false) y el atajo dejaba la tabla en «cargando» para siempre. Cada cambio pide sus datos.
    let vigente = true
    rankingConvocatoria(convocatoriaId, { page: pagina })
      .then((res) => {
        if (!vigente) return
        cargadoClave.current = clave
        // Si la versión cambia mientras hay candidatos elegidos, lo elegido se hizo sobre otro ranking.
        if (versionVista.current && versionVista.current !== res.meta.version && seleccionados.current > 0) {
          setDesactualizado(true)
        }
        versionVista.current = res.meta.version
        // El servidor ajusta la página pedida si se pasó de la última.
        if (res.meta.current_page !== pagina) setPagina(res.meta.current_page)
        setEstado({ fase: 'listo', filas: res.data, meta: res.meta, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [abierta, activo, convocatoriaId, pagina, intento])

  // El resultado de una acción se lleva a la vista y recibe el foco: con teclado o lector de pantalla se oye y se
  // ve justo donde se pulsó, aunque el botón que abrió el diálogo ya no esté disponible.
  useEffect(() => {
    if (!aviso?.mover) return
    mensajeRef.current?.scrollIntoView({ block: 'nearest' })
    mensajeRef.current?.focus({ preventScroll: true })
  }, [aviso])

  const recargar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }
  const cambiarPagina = (n) => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setPagina(n)
  }

  const { fase, filas, meta, error } = estado
  const cargando = fase === 'cargando'
  const hayFilas = filas.length > 0
  const modo = meta?.modo
  // Puesto y resultado solo existen con actividades configuradas: sin ellas el servidor no los calcula.
  const conPuesto = modo === 'con_actividades'
  const puedeElegir = puedeDecidir && enProceso === true && (modo === 'con_actividades' || modo === 'sin_actividades')
  const puedeCambiarObjetivo = puedeDecidir && enProceso === true && modo !== 'pendiente_de_configurar'
  const empate = meta?.empate_en_corte ?? null
  const lista = meta?.lista_confirmada ?? null
  const enComparacion = comparacion.modo
  // Una sola columna de casillas: «Elegir» (solo quien puede elegir) o, en modo comparación, «Comparar».
  const columnaCasillas = enComparacion || puedeElegir

  const seleccionRanking = useSeleccionRanking({ aviso, borrador, borradorActual, cargadoClave, cargando, convocatoriaId, error, fase, filas, intentoActual, lista, meta, montado, onConfirmada, paginaActual, recargar, seleccionActual, setAviso, setBorrador, setBuscando, setDesactualizado, setEstado, setPagina, setRevision, setSeleccion, sugeridosEnCache, versionVista })
  const { abrirRevision, alConfirmar, alRankingDesactualizado, alternar, leerRankingCompleto, leerSugeridos, limpiar, manejarCambioDeRanking, sincronizar, usarSugerencia } = seleccionRanking
  // Avisos del estado: una línea por tema, sin repetir lo que ya dicen las cifras.
  const avisos = []
  if (enProceso === false && modo !== 'pendiente_de_configurar') {
    avisos.push({ tono: 'aviso', texto: 'Solo se pueden confirmar finalistas con la convocatoria en proceso.' })
  }
  if (modo === 'sin_actividades') {
    avisos.push({ tono: 'info', texto: 'Sin actividades: no hay puesto, resultado ni sugerencia. Elige a mano e indica la justificación al confirmar.' })
  }
  if (empate) {
    avisos.push({
      tono: 'aviso',
      texto: `Empate en el corte: ${empate.postulaciones.length} candidatos comparten la posición ${empate.posicion} (${empate.resultado}). No se sugiere ninguno: elige quiénes pasan y justifícalo al confirmar.`,
    })
  }
  if (modo !== 'pendiente_de_configurar' && meta?.no_listos > 0) {
    avisos.push({
      tono: 'info',
      texto: `${meta.no_listos} ${meta?.no_listos === 1 ? 'candidato aún no está listo' : 'candidatos aún no están listos'}: les falta habilitación documental o alguna nota.`,
    })
  }
  if (lista) {
    const resumenLista = `Lista confirmada v${lista.version} · ${lista.total} ${lista.total === 1 ? 'finalista' : 'finalistas'}`
    avisos.push(
      lista.requiere_revision
        ? // El ranking solo informa que la lista requiere revisión; el motivo de cada finalista se entrega en «Finalistas».
          { tono: 'aviso', texto: `${resumenLista} · Requiere revisión: ya no coincide con el ranking. Revísala en «Finalistas», donde se indica el motivo de cada finalista.` }
        : { tono: 'exito', texto: `${resumenLista} · Al día` },
    )
  }
  const hayAlerta = avisos.some((a) => a.tono === 'aviso')

    return {
      ...seleccionRanking,
      abierta,
      abrirObjetivo,
      abrirRevision,
      activo,
      alConfirmar,
      alRankingDesactualizado,
      alternar,
      aviso,
      avisoObjetivo,
      avisoTransitorio,
      avisos,
      borrador,
      borradorActual,
      botonCambiar,
      buscando,
      cambiarPagina,
      cargadoClave,
      cargando,
      cerrarObjetivo,
      columnaCasillas,
      comparacion,
      conPuesto,
      convocatoriaId,
      desactualizado,
      empate,
      enComparacion,
      enProceso,
      error,
      errorObjetivo,
      estado,
      fase,
      filas,
      guardandoObjetivo,
      guardarObjetivo,
      hayAlerta,
      hayFilas,
      intento,
      intentoActual,
      leerRankingCompleto,
      leerSugeridos,
      limpiar,
      lista,
      manejarCambioDeRanking,
      mensajeRef,
      meta,
      modo,
      montado,
      objetivoActual,
      objetivoCambio,
      objetivoNumero,
      objetivoTexto,
      objetivoValido,
      onConfirmada,
      pagina,
      paginaActual,
      pausaAviso,
      pausaObjetivo,
      puedeCambiarObjetivo,
      puedeDecidir,
      puedeElegir,
      recargar,
      revision,
      seleccion,
      seleccionActual,
      seleccionados,
      setAbierta,
      setAviso,
      setAvisoObjetivo,
      setBorrador,
      setBuscando,
      setDesactualizado,
      setErrorObjetivo,
      setEstado,
      setGuardandoObjetivo,
      setIntento,
      setObjetivoTexto,
      setPagina,
      setRevision,
      setSeleccion,
      sincronizar,
      sugeridosEnCache,
      textoObjetivo,
      usarSugerencia,
      versionVista,
    }
}
