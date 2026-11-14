import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { confirmarFinalistas, fijarObjetivoFinalistas, rankingConvocatoria } from '../../api/seleccion'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import useAvisoTransitorio from '../../hooks/useAvisoTransitorio'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import AvatarIniciales from '../evaluacion/AvatarIniciales'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Dialogo from '../ui/Dialogo'
import Etiqueta from '../ui/Etiqueta'
import Icono from '../ui/Icono'
import { MensajeAviso, MensajeError, MensajeExito } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import Paginacion from '../ui/Paginacion'
import BarraComparar, { CasillaComparar } from './BarraComparar'
import CasillaSeleccion from './CasillaSeleccion'
import {
  CLASE_CAJA_SUAVE,
  CLASE_CAMPO,
  CLASE_META_DD,
  CLASE_META_DT,
  CLASE_TARJETA_PLANA,
  CLASE_TBODY,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_THEAD,
} from '../../lib/estilos'
import { SUGERENCIA, textoCumplimiento, textoNota } from '../../lib/seleccion'

const CLASE_TH = 'px-3 py-2.5 first:pl-4 last:pr-4'
const CLASE_TD = 'px-3 py-2.5 align-middle first:pl-4 last:pr-4'
const CLASE_CHECK = 'size-5 shrink-0 cursor-pointer accent-sena-oscuro disabled:cursor-not-allowed'

function EtiquetaSugerencia({ codigo }) {
  const s = SUGERENCIA[codigo]
  if (!s) return null
  return (
    <EtiquetaConIcono tono={s.tono} icono={s.icono ? <Icono nombre={s.icono} className="size-3.5" /> : null}>
      {s.texto}
    </EtiquetaConIcono>
  )
}

function SinDato({ lectura }) {
  return (
    <span className={CLASE_TEXTO_SUAVE}>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{lectura}</span>
    </span>
  )
}


// Ranking de los candidatos listos de UNA convocatoria, objetivo de finalistas y confirmación de la lista.
// El servidor ordena, asigna posiciones, sugiere y detecta empates; aquí solo se muestra y se elige.
// La selección vive en un Map (id -> fila) para sobrevivir al cambio de página. El padre lo monta con
// 'key' = id de la convocatoria.
// 'activo': la pestaña está a la vista. El ranking se pide la primera vez que se abre y al volver no se repite
// (salvo que algo lo haya invalidado: un guardado, una confirmación o un 409 piden la recarga explícita).
export default function PanelRanking({ convocatoriaId, activo = true, enProceso, puedeDecidir, comparacion, onConfirmada }) {
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

  // Objetivo: null = el formulario está cerrado; un texto = abierto y editándose.
  const [objetivoTexto, setObjetivoTexto] = useState(null)
  const [guardandoObjetivo, setGuardandoObjetivo] = useState(false)
  const [errorObjetivo, setErrorObjetivo] = useState('')
  // Confirmación del último cambio de objetivo ({ texto }); un objeto nuevo en cada cambio reinicia su plazo.
  const [avisoObjetivo, setAvisoObjetivo] = useState(null)

  // Las confirmaciones breves de éxito se retiran solas a los pocos segundos (el objetivo y la elección quedan igual).
  // Los avisos que requieren atención y los errores NO: siguen visibles hasta la siguiente acción.
  const avisoTransitorio = aviso && (aviso.tipo === 'exito' || aviso.tipo === 'info') ? aviso : null
  const pausaAviso = useAvisoTransitorio(avisoTransitorio, () => setAviso(null))
  const pausaObjetivo = useAvisoTransitorio(avisoObjetivo, () => setAvisoObjetivo(null))

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
    if (cargadoClave.current === clave) return undefined
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

  const alternar = (fila) => {
    setAviso(null)
    setSeleccion((previo) => {
      const siguiente = new Map(previo)
      if (siguiente.has(fila.postulacion_id)) siguiente.delete(fila.postulacion_id)
      else {
        // Se guarda la marca de la fila y la versión del ranking en que se vio: sirve para comparar con la sugerencia
        // al confirmar sin volver a pedir páginas.
        siguiente.set(fila.postulacion_id, {
          aspirante: fila.aspirante,
          posicion: fila.posicion,
          sugerencia: fila.sugerencia,
          version: meta.version,
        })
      }
      return siguiente
    })
  }

  const limpiar = () => {
    setAviso(null)
    setSeleccion(new Map())
    setBorrador('')
  }

  // Los sugeridos ocupan siempre los primeros puestos: se leen las páginas necesarias (la actual no se pide de nuevo).
  // Si el ranking cambia mientras se leen, se descarta todo y se pide revisar.
  const leerSugeridos = async () => {
    const version = meta.version
    if (sugeridosEnCache.current.version === version) return sugeridosEnCache.current.ids
    const ids = new Map()
    for (let p = 1; ids.size < meta.sugeridos && p <= meta.last_page; p += 1) {
      const res = p === meta.current_page ? { data: filas, meta } : await rankingConvocatoria(convocatoriaId, { page: p })
      if (res.meta.version !== version) {
        const cambio = new Error('ranking_cambio')
        cambio.cambio = true
        throw cambio
      }
      for (const f of res.data) {
        if (f.sugerencia === 'sugerido') {
          ids.set(f.postulacion_id, { aspirante: f.aspirante, posicion: f.posicion, sugerencia: 'sugerido', version })
        }
      }
    }
    sugeridosEnCache.current = { version, ids }
    return ids
  }

  // Lee TODO el ranking (todas sus páginas, con la misma versión). Solo se usa al recuperarse de un cambio del
  // ranking; abrir la confirmación manual no pide páginas.
  const leerRankingCompleto = async () => {
    for (let lectura = 0; lectura < 3; lectura += 1) {
      const paginas = []
      let version = null
      let consistente = true
      for (let p = 1; p <= (paginas[0]?.meta.last_page ?? 1); p += 1) {
        const res = await rankingConvocatoria(convocatoriaId, { page: p })
        if (version && res.meta.version !== version) {
          consistente = false
          break
        }
        version = res.meta.version
        paginas.push(res)
      }
      if (consistente) return paginas
    }
    const inestable = new Error('inestable')
    inestable.mensaje = 'El ranking sigue cambiando. Inténtalo de nuevo en un momento.'
    throw inestable
  }

  // Recuperación tras un cambio del ranking (409 o versión distinta al leer): se conserva la elección, se renuevan
  // sus marcas con la versión actual, se quitan —y se dicen— los elegidos que ya no están disponibles y se pide
  // revisar la lista antes de confirmar de nuevo.
  const sincronizar = async (texto) => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    try {
      const paginas = await leerRankingCompleto()
      if (!montado.current) return
      const version = paginas[0].meta.version
      const disponibles = new Map(paginas.flatMap((r) => r.data).map((f) => [f.postulacion_id, f]))
      const siguiente = new Map()
      const perdidos = []
      for (const [id, e] of seleccionActual.current) {
        const f = disponibles.get(id)
        if (f) siguiente.set(id, { aspirante: f.aspirante, posicion: f.posicion, sugerencia: f.sugerencia, version })
        else perdidos.push(e.aspirante)
      }
      const vista = Math.min(paginaActual.current, paginas.length)
      cargadoClave.current = `${vista}|${intentoActual.current}`
      versionVista.current = version
      sugeridosEnCache.current = { version: null, ids: null }
      if (vista !== paginaActual.current) setPagina(vista)
      setEstado({ fase: 'listo', filas: paginas[vista - 1].data, meta: paginas[vista - 1].meta, error: '' })
      setSeleccion(siguiente)
      setDesactualizado(true)
      const notas = [texto]
      if (perdidos.length > 0) {
        notas.push(`Ya no están disponibles y se quitaron de tu elección: ${perdidos.join(', ')}.`)
      }
      if (borradorActual.current.trim() !== '') notas.push('Tu justificación quedó como borrador.')
      setAviso({ tipo: 'aviso', mover: true, texto: notas.join(' ') })
    } catch (e) {
      if (!montado.current) return
      setEstado((previo) => ({ ...previo, fase: 'error', error: e.mensaje ?? mensajeError(e) }))
    }
  }

  const manejarCambioDeRanking = () =>
    sincronizar('El ranking cambió mientras trabajabas. Se actualizó: revisa tu lista antes de confirmar.')

  const usarSugerencia = async () => {
    setBuscando(true)
    setAviso(null)
    try {
      const ids = await leerSugeridos()
      if (!montado.current) return
      setSeleccion(new Map(ids))
      setAviso({ tipo: 'info', texto: `Se eligieron los ${ids.size} candidatos sugeridos.` })
    } catch (e) {
      if (!montado.current) return
      if (e.cambio) manejarCambioDeRanking()
      else setAviso({ tipo: 'error', mover: true, texto: mensajeError(e) })
    } finally {
      if (montado.current) setBuscando(false)
    }
  }

  // La confirmación manual abre sin pedir nada: compara la elección con meta.sugeridos y con las marcas de las filas
  // elegidas (ver DialogoConfirmacion). El backend sigue validando la justificación.
  const abrirRevision = () => {
    setAviso(null)
    setRevision(true)
  }

  const abrirObjetivo = () => {
    setAvisoObjetivo(null)
    setErrorObjetivo('')
    setObjetivoTexto(String(meta.objetivo.valor))
  }
  const cerrarObjetivo = () => {
    setObjetivoTexto(null)
    setErrorObjetivo('')
    // El foco vuelve al botón que abrió el formulario (existe otra vez al cerrarse).
    requestAnimationFrame(() => botonCambiar.current?.focus())
  }

  const guardarObjetivo = async (valor) => {
    setGuardandoObjetivo(true)
    setErrorObjetivo('')
    try {
      await fijarObjetivoFinalistas(convocatoriaId, valor)
      if (!montado.current) return
      setObjetivoTexto(null)
      setAvisoObjetivo({ texto: valor == null ? 'Objetivo restablecido a 2 × vacantes.' : `Objetivo actualizado a ${valor}.` })
      recargar()
      requestAnimationFrame(() => botonCambiar.current?.focus())
    } catch (e) {
      if (!montado.current) return
      const porCampo = erroresDeCampo(e)
      setErrorObjetivo(Object.values(porCampo)[0] ?? mensajeError(e))
    } finally {
      if (montado.current) setGuardandoObjetivo(false)
    }
  }

  const alConfirmar = ({ creada }) => {
    setRevision(false)
    setBorrador('')
    setSeleccion(new Map())
    setDesactualizado(false)
    setAviso({
      tipo: 'exito',
      mover: true,
      texto: creada
        ? 'Finalistas confirmados. Quedó registrada una nueva versión de la lista.'
        : 'La lista vigente ya coincidía con esta elección: no se creó una versión nueva.',
    })
    recargar()
    // Avisa al padre: la lista vigente de la pestaña Finalistas ya no es la que se vio.
    onConfirmada?.()
  }

  const alRankingDesactualizado = () => {
    setRevision(false)
    sincronizar('El ranking cambió desde que lo consultaste. Lo actualizamos: revisa la lista y marca que la revisaste para confirmar de nuevo.')
    // También la lista vigente puede haber cambiado: se pide de nuevo al abrir Finalistas.
    onConfirmada?.()
  }

  const objetivoActual = meta ? String(meta.objetivo.valor) : ''
  const textoObjetivo = objetivoTexto ?? objetivoActual
  const objetivoNumero = Number(textoObjetivo)
  const objetivoValido = /^\d+$/.test(textoObjetivo) && objetivoNumero >= 1 && objetivoNumero <= 500
  const objetivoCambio = textoObjetivo !== objetivoActual

  if (fase === 'error' && !meta) {
    return (
      <div className="flex flex-col items-start gap-3">
        <MensajeError>{error}</MensajeError>
        <Boton variante="contorno" tamano="tactil" onClick={recargar}>
          Reintentar
        </Boton>
      </div>
    )
  }
  if (!meta) {
    return (
      <p role="status" className={`flex items-center gap-2 py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>
        <Rueda /> Cargando ranking…
      </p>
    )
  }

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
  if (modo !== 'pendiente_de_configurar' && meta.no_listos > 0) {
    avisos.push({
      tono: 'info',
      texto: `${meta.no_listos} ${meta.no_listos === 1 ? 'candidato aún no está listo' : 'candidatos aún no están listos'}: les falta habilitación documental o alguna nota.`,
    })
  }
  if (lista) {
    avisos.push(
      lista.requiere_revision
        ? { tono: 'aviso', texto: `Lista vigente v${lista.version} (${lista.total}): ya no coincide con el ranking. Revísala en «Finalistas».` }
        : { tono: 'exito', texto: `Lista vigente v${lista.version} (${lista.total} ${lista.total === 1 ? 'finalista' : 'finalistas'}): coincide con el ranking.` },
    )
  }
  const hayAlerta = avisos.some((a) => a.tono === 'aviso')

  return (
    <div className="@container flex flex-col gap-3" aria-busy={cargando}>
      {fase === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={recargar}>
            Reintentar
          </Boton>
        </div>
      )}

      {/* Resumen en una tarjeta, igual que la de Decidir: solo las cifras que ayudan a decidir según la configuración. */}
      <section aria-label="Resumen del ranking" className="flex flex-col gap-3">
        <dl className={`${CLASE_TARJETA_PLANA} grid grid-cols-2 gap-x-5 gap-y-3 p-4 @min-[520px]:grid-cols-4`}>
          <div>
            <dt className={CLASE_META_DT}>Candidatos listos</dt>
            <dd className={`${CLASE_META_DD} tabular-nums`}>
              {meta.listos}
              <span className={`font-normal ${CLASE_TEXTO_SUAVE}`}> de {meta.postuladas}</span>
            </dd>
          </div>
          <div>
            <dt className={CLASE_META_DT}>Vacantes</dt>
            <dd className={`${CLASE_META_DD} tabular-nums`}>{meta.vacantes}</dd>
          </div>
          {modo !== 'pendiente_de_configurar' && (
            <div>
              <dt className={CLASE_META_DT}>Objetivo de finalistas</dt>
              <dd className={`${CLASE_META_DD} flex flex-wrap items-center gap-x-2`}>
                <span className="tabular-nums">{meta.objetivo.valor}</span>
                {meta.objetivo.efectivo !== meta.objetivo.valor && (
                  <span className={`text-xs font-normal tabular-nums ${CLASE_TEXTO_SUAVE}`}>(alcanzan {meta.objetivo.efectivo})</span>
                )}
                {puedeCambiarObjetivo && objetivoTexto == null && (
                  <Boton ref={botonCambiar} variante="enlace" tamano="flexible" className="-my-3 px-1" onClick={abrirObjetivo}>
                    Cambiar
                  </Boton>
                )}
              </dd>
            </div>
          )}
          {modo === 'con_actividades' && (
            <div>
              <dt className={CLASE_META_DT}>Sugeridos</dt>
              <dd className={`${CLASE_META_DD} tabular-nums`}>{meta.sugeridos}</dd>
            </div>
          )}
        </dl>

        {avisoObjetivo && objetivoTexto == null && (
          <p role="status" className="text-sm font-medium text-exito" {...pausaObjetivo}>
            {avisoObjetivo.texto}
          </p>
        )}

        {puedeCambiarObjetivo && objetivoTexto != null && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              if (objetivoValido && objetivoCambio && !guardandoObjetivo) guardarObjetivo(objetivoNumero)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !guardandoObjetivo) cerrarObjetivo()
            }}
            className={`${CLASE_CAJA_SUAVE} flex flex-col gap-3 p-3 @min-[600px]:flex-row @min-[600px]:items-end`}
            aria-busy={guardandoObjetivo}
          >
            <Campo
              etiqueta="Objetivo de finalistas"
              error={errorObjetivo || (!objetivoValido ? 'Escribe un entero entre 1 y 500.' : '')}
              ayuda={`Sin fijarlo se usa 2 × vacantes (${2 * meta.vacantes}).`}
              className="@min-[600px]:w-60"
            >
              {({ id, describedby, invalid }) => (
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  autoFocus
                  value={textoObjetivo}
                  onChange={(e) => {
                    setErrorObjetivo('')
                    setObjetivoTexto(e.target.value.replace(/\D/g, '').slice(0, 3))
                  }}
                  disabled={guardandoObjetivo}
                  aria-describedby={describedby}
                  aria-invalid={invalid || undefined}
                  className={CLASE_CAMPO}
                />
              )}
            </Campo>
            <div className="flex flex-wrap gap-2 @min-[600px]:pb-px">
              <Boton type="submit" tamano="tactil" ocupado={guardandoObjetivo} disabled={!objetivoValido || !objetivoCambio}>
                {guardandoObjetivo ? 'Guardando…' : 'Guardar'}
              </Boton>
              <Boton variante="contorno" tamano="tactil" disabled={guardandoObjetivo} onClick={cerrarObjetivo}>
                Cancelar
              </Boton>
              {meta.objetivo.configurado && (
                <Boton variante="enlace" tamano="tactil" disabled={guardandoObjetivo} onClick={() => guardarObjetivo(null)}>
                  Volver a 2 × vacantes
                </Boton>
              )}
            </div>
          </form>
        )}
      </section>

      {avisos.length > 0 && (
        <section
          aria-label="Avisos del ranking"
          className={`px-3 py-2.5 ${hayAlerta ? 'rounded-xl border border-aviso/30 bg-aviso/10' : CLASE_CAJA_SUAVE}`}
        >
          <ul className="flex flex-col gap-1.5">
            {avisos.map((a) => (
              <li key={a.texto} className={`flex items-start gap-2 text-sm ${CLASE_TEXTO_FUERTE}`}>
                {a.tono === 'aviso' && <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0 text-aviso" />}
                {a.tono === 'exito' && <Icono nombre="check" className="mt-0.5 size-4 shrink-0 text-exito" />}
                {a.tono === 'info' && <span aria-hidden="true" className="mt-0.5 w-4 shrink-0 text-center">•</span>}
                <span className="min-w-0">{a.texto}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {modo === 'pendiente_de_configurar' && (
        <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
          <h3 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Falta configurar las actividades</h3>
          <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
            Mientras no se configure la entrevista y la prueba técnica (o se elija «Sin actividades»), nadie entra en el ranking.
            {meta.no_listos > 0 && ` Hay ${meta.postuladas} ${meta.postuladas === 1 ? 'candidato' : 'candidatos'} esperando.`}
          </p>
          <Link
            to={`/seleccion/preseleccion?convocatoria=${convocatoriaId}&pestana=configuracion`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sena-azul/60 px-4 text-sm font-semibold text-sena-azul hover:bg-sena-cielo/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena dark:border-sena-texto-suave/70 dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
          >
            Ir a la configuración
          </Link>
        </div>
      )}

      {modo !== 'pendiente_de_configurar' && !hayFilas && (
        <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
          <h3 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no hay candidatos listos</h3>
          <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
            Aparecen cuando están habilitados documentalmente y con todas sus actividades calificadas.
          </p>
        </div>
      )}

      {/* «Comparar candidatos» (CU-SEL-017) es un modo de la tabla, independiente de «Elegir»: sus marcas se guardan aparte
          y sobreviven a la paginación. Mientras está activo no hay casillas de «Elegir» ni acciones de confirmar, pero la
          elección (estado de este panel, que sigue montado) queda tal cual y reaparece al salir. */}
      {hayFilas && <BarraComparar comparacion={comparacion} />}

      {hayFilas && (
        <div className={`${CLASE_TARJETA_PLANA} overflow-hidden ${cargando ? 'opacity-60' : ''}`}>
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Ranking de candidatos listos</caption>
            {/* Puesto y Resultado son columnas propias en escritorio y solo existen con actividades (sin ellas no hay nada que
                mostrar). En móvil esos datos van bajo el nombre, con su etiqueta. 'Documental' tiene ancho de sobra para su
                encabezado en mayúsculas con el relleno de la celda: antes se recortaba contra el borde de la tarjeta. */}
            {/* Desde 640 px Aspirante ocupa poco más de un tercio (o el 60 % sin Puesto ni Resultado) y las demás columnas
                se reparten el resto por igual, en vez de dejarle todo el ancho sobrante al nombre. Por debajo, anchos fijos
                (el encabezado «Documental» necesita unos 115 px). */}
            {/* Entre 640 y 860 px las cifras necesitan anchos fijos; desde 860 px Aspirante toma un tercio y las cifras se
                reparten el resto por igual. La columna de casillas mide 96 px en modo comparación (su encabezado es más largo). */}
            <colgroup>
              {columnaCasillas && <col className={enComparacion ? 'w-24' : 'w-14 @min-[640px]:w-20'} />}
              <col className={conPuesto ? '@min-[860px]:w-[34%]' : '@min-[860px]:w-[56%]'} />
              {conPuesto && <col className="hidden w-16 @min-[640px]:table-column @min-[860px]:w-auto" />}
              {conPuesto && <col className="hidden w-24 @min-[640px]:table-column @min-[860px]:w-auto" />}
              <col className="hidden w-32 @min-[640px]:table-column @min-[860px]:w-auto" />
            </colgroup>
            <thead className={CLASE_THEAD}>
              <tr>
                {columnaCasillas && (
                  <th scope="col" className={CLASE_TH}>
                    {enComparacion ? 'Comparar' : 'Elegir'}
                  </th>
                )}
                <th scope="col" className={CLASE_TH}>Aspirante</th>
                {conPuesto && <th scope="col" className={`hidden @min-[640px]:table-cell ${CLASE_TH} text-right`}>Puesto</th>}
                {conPuesto && <th scope="col" className={`hidden @min-[640px]:table-cell ${CLASE_TH} text-right`}>Resultado</th>}
                <th scope="col" className={`hidden @min-[640px]:table-cell ${CLASE_TH} text-right`}>Documental</th>
              </tr>
            </thead>
            <tbody className={CLASE_TBODY}>
              {filas.map((f) => {
                const res = textoNota(f.resultado_adicional)
                const doc = textoCumplimiento(f.cumplimiento_documental)
                return (
                  <tr
                    key={f.postulacion_id}
                    className={
                      f.sugerencia === 'empate_en_corte'
                        ? 'bg-aviso/5 hover:bg-aviso/10'
                        : 'hover:bg-sena-fondo/60 dark:hover:bg-sena-superficie-alta/40'
                    }
                  >
                    {columnaCasillas && (
                      <td className={CLASE_TD}>
                        {/* Una sola columna de casillas: «Elegir» en la vista normal, «Comparar» en el modo comparación. */}
                        {enComparacion ? (
                          <CasillaComparar comparacion={comparacion} id={f.postulacion_id} aspirante={f.aspirante} />
                        ) : (
                          <CasillaSeleccion
                            marcada={seleccion.has(f.postulacion_id)}
                            onCambiar={() => alternar(f)}
                            etiqueta={`Elegir a ${f.aspirante} como finalista`}
                          />
                        )}
                      </td>
                    )}
                    <td className={CLASE_TD}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="hidden shrink-0 @min-[860px]:block"><AvatarIniciales nombre={f.aspirante} /></span>
                        <div className="flex min-w-0 flex-col items-start gap-1">
                          {/* Dos líneas como máximo; el nombre completo también va en el title y en la casilla. */}
                          <span title={f.aspirante} className={`line-clamp-2 font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                            {f.aspirante}
                          </span>
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <EtiquetaSugerencia codigo={f.sugerencia} />
                            {f.finalista && <Etiqueta tono="azul" className="whitespace-nowrap">En la lista vigente</Etiqueta>}
                          </span>
                          {/* En móvil los datos van bajo el nombre y dicen qué son: «Puesto 1 · Resultado 10,00 · Documental 100 %». */}
                          {(conPuesto || doc != null) && (
                            <span className={`text-xs tabular-nums @min-[640px]:hidden ${CLASE_TEXTO_SUAVE}`}>
                              {[
                                conPuesto && `Puesto ${f.posicion ?? '—'}`,
                                conPuesto && `Resultado ${res ?? '—'}`,
                                doc != null && `Documental ${doc}`,
                              ]
                                .filter(Boolean)
                                // Espacio duro dentro de cada dato: la línea se parte entre datos, nunca entre «100» y «%».
                                .map((dato) => dato.replace(/ /g, ' '))
                                .join(' · ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {conPuesto && (
                      <td className={`hidden @min-[640px]:table-cell ${CLASE_TD} text-right`}>
                        <span className={`font-semibold tabular-nums ${CLASE_TEXTO_FUERTE}`}>{f.posicion ?? '—'}</span>
                      </td>
                    )}
                    {conPuesto && (
                      <td className={`hidden @min-[640px]:table-cell ${CLASE_TD} text-right`}>
                        {res == null ? (
                          <SinDato lectura="Sin resultado" />
                        ) : (
                          <span className={`font-semibold tabular-nums ${CLASE_TEXTO_FUERTE}`}>{res}</span>
                        )}
                      </td>
                    )}
                    <td className={`hidden @min-[640px]:table-cell ${CLASE_TD} text-right`}>
                      {doc == null ? (
                        <SinDato lectura="Sin dato de cumplimiento" />
                      ) : (
                        <span className={`font-medium tabular-nums ${CLASE_TEXTO_FUERTE}`}>{doc}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {hayFilas && (
        <Paginacion
          meta={meta}
          singular="candidato listo"
          plural="candidatos listos"
          etiqueta="Paginación del ranking"
          ocupado={cargando}
          onPagina={cambiarPagina}
          className="px-1"
        />
      )}

      {puedeElegir && !enComparacion && hayFilas && (
        <section
          aria-label="Elección de finalistas"
          className={`${CLASE_TARJETA_PLANA} flex flex-col gap-3 p-3`}
        >
          {/* El resultado de la última acción va aquí, pegado a los botones, también cuando la elección queda vacía. */}
          {aviso && (
            <div ref={mensajeRef} tabIndex={-1} className="focus:outline-none" {...(avisoTransitorio ? pausaAviso : {})}>
              {(aviso.tipo === 'exito' || aviso.tipo === 'info') && <MensajeExito>{aviso.texto}</MensajeExito>}
              {aviso.tipo === 'aviso' && <MensajeAviso>{aviso.texto}</MensajeAviso>}
              {aviso.tipo === 'error' && <MensajeError>{aviso.texto}</MensajeError>}
            </div>
          )}
          {/* Resumen a la izquierda y, a la derecha, el grupo de acciones que nunca se parte: «Revisar y confirmar» es la
              acción principal y va última (en móvil, primera y a ancho completo); «Elegir la sugerencia» y «Vaciar elección»
              son secundarias. Con poco ancho el resumen queda arriba y los botones debajo, como grupo. */}
          <div className="flex flex-col gap-3 @min-[860px]:flex-row @min-[860px]:items-center @min-[860px]:justify-between">
            <p aria-live="polite" className={`min-w-0 text-sm ${CLASE_TEXTO_FUERTE}`}>
              <span className="font-semibold tabular-nums">{seleccion.size}</span>{' '}
              {seleccion.size === 1 ? 'candidato elegido' : 'candidatos elegidos'} · objetivo{' '}
              <span className="tabular-nums">{meta.objetivo.efectivo}</span>
              {desactualizado && <span className="font-medium text-aviso"> · pendiente de revisar</span>}
            </p>
            <div className="flex flex-col gap-2 @min-[560px]:flex-row @min-[560px]:items-center @min-[560px]:justify-between @min-[860px]:shrink-0 @min-[860px]:justify-end @min-[860px]:gap-4">
              <div className="order-last flex flex-wrap items-center justify-center gap-2 @min-[560px]:order-first @min-[560px]:flex-nowrap @min-[560px]:justify-start">
                {modo === 'con_actividades' && meta.sugeridos > 0 && (
                  <Boton variante="contorno" ocupado={buscando} onClick={usarSugerencia}>
                    {buscando ? 'Buscando…' : 'Elegir la sugerencia'}
                  </Boton>
                )}
                <Boton variante="enlace" disabled={seleccion.size === 0 || buscando} onClick={limpiar}>
                  Vaciar elección
                </Boton>
              </div>
              <Boton
                className="order-first w-full @min-[560px]:order-last @min-[560px]:w-auto"
                disabled={seleccion.size === 0 || buscando}
                onClick={abrirRevision}
              >
                Revisar y confirmar
              </Boton>
            </div>
          </div>
        </section>
      )}

      {revision && (
        <DialogoConfirmacion
          convocatoriaId={convocatoriaId}
          version={meta.version}
          modo={modo}
          empate={empate}
          objetivo={meta.objetivo.efectivo}
          seleccion={seleccion}
          totalSugeridos={meta.sugeridos}
          justificacion={borrador}
          onJustificacion={setBorrador}
          desactualizado={desactualizado}
          onCerrar={() => setRevision(false)}
          onConfirmada={alConfirmar}
          onDesactualizado={alRankingDesactualizado}
        />
      )}
    </div>
  )
}

// Revisión final antes de confirmar. La justificación es obligatoria cuando se elige a mano (sin
// actividades), se resuelve un empate en el corte o la lista difiere de la sugerida; si el servidor la
// pide y aquí no se preveía, el error aparece bajo el campo.
function DialogoConfirmacion({
  convocatoriaId,
  version,
  modo,
  empate,
  objetivo,
  seleccion,
  totalSugeridos,
  justificacion,
  onJustificacion,
  desactualizado,
  onCerrar,
  onConfirmada,
  onDesactualizado,
}) {
  const setJustificacion = onJustificacion
  const [revisada, setRevisada] = useState(!desactualizado)
  const [enviando, setEnviando] = useState(false)
  const [errorJustificacion, setErrorJustificacion] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')
  const montado = useRef(true)
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const ids = new Set(seleccion.keys())
  const motivos = []
  // Comparación con la sugerencia sin pedir páginas: la elección coincide si tiene tantos candidatos como
  // meta.sugeridos y todos estaban marcados «sugerido» en esta misma versión del ranking. Si alguna marca es de
  // otra versión no se puede afirmar nada: se avisa y el servidor valida si hace falta justificación.
  const entradas = [...seleccion.values()]
  const marcasVigentes = entradas.every((e) => e.version === version && e.sugerencia !== undefined)
  const coincide = marcasVigentes && ids.size === totalSugeridos && entradas.every((e) => e.sugerencia === 'sugerido')
  if (modo === 'sin_actividades') motivos.push('elegiste a los finalistas a mano, sin actividades')
  if (empate) motivos.push('hay un empate en el corte')
  if (modo === 'con_actividades' && marcasVigentes && !coincide) motivos.push('la lista difiere de la sugerida')
  const incierta = modo === 'con_actividades' && !marcasVigentes && motivos.length === 0
  const obligatoria = motivos.length > 0
  const texto = justificacion.trim()
  const largoValido = texto.length >= 10 && texto.length <= 500
  const puedeEnviar = revisada && (!obligatoria || largoValido) && (texto === '' || largoValido) && !enviando
  const elegidos = [...seleccion.entries()].sort(
    ([, a], [, b]) => (a.posicion ?? Infinity) - (b.posicion ?? Infinity) || a.aspirante.localeCompare(b.aspirante, 'es'),
  )

  const enviar = async (e) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setEnviando(true)
    setErrorJustificacion('')
    setErrorGeneral('')
    try {
      const cuerpo = { version, postulacion_ids: [...ids] }
      if (texto) cuerpo.justificacion = texto
      const res = await confirmarFinalistas(convocatoriaId, cuerpo)
      if (montado.current) onConfirmada(res)
    } catch (err) {
      if (!montado.current) return
      if (err.response?.status === 409 && err.response.data?.codigo === 'ranking_desactualizado') {
        onDesactualizado()
        return
      }
      const porCampo = erroresDeCampo(err)
      if (porCampo.justificacion) setErrorJustificacion(porCampo.justificacion)
      const otro = Object.entries(porCampo).find(([campo]) => campo !== 'justificacion')
      setErrorGeneral(otro ? otro[1] : Object.keys(porCampo).length === 0 ? mensajeError(err) : '')
    } finally {
      if (montado.current) setEnviando(false)
    }
  }

  return (
    <Dialogo idTitulo="confirmar-finalistas-titulo" onCerrar={enviando ? () => {} : onCerrar} className="max-w-xl">
      <form onSubmit={enviar} noValidate aria-busy={enviando} className="flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <h2 id="confirmar-finalistas-titulo" className={`text-lg font-bold ${CLASE_TEXTO_FUERTE}`}>
            Confirmar finalistas
          </h2>
          <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>
            Eliges <span className="font-semibold tabular-nums">{ids.size}</span>{' '}
            {ids.size === 1 ? 'candidato' : 'candidatos'} para un objetivo de{' '}
            <span className="tabular-nums">{objetivo}</span>. Se registrará una versión nueva de la lista.
          </p>
        </div>

        <ul className={`${CLASE_CAJA_SUAVE} max-h-52 divide-y divide-sena-linea/60 overflow-y-auto dark:divide-sena-borde/40`}>
          {elegidos.map(([id, f]) => (
            <li key={id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className={`min-w-0 ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{f.aspirante}</span>
              <span className={`shrink-0 tabular-nums ${CLASE_TEXTO_SUAVE}`}>
                {f.posicion == null ? 'Sin posición' : `Posición ${f.posicion}`}
              </span>
            </li>
          ))}
        </ul>

        {desactualizado && (
          <MensajeAviso>
            El ranking cambió mientras elegías. Revisa que la lista siga siendo la que quieres antes de confirmar.
          </MensajeAviso>
        )}

        <Campo
          etiqueta="Justificación"
          requerido={obligatoria}
          error={errorJustificacion || (texto !== '' && !largoValido ? 'Debe tener entre 10 y 500 caracteres.' : '')}
          ayuda={
            obligatoria
              ? `Obligatoria porque ${motivos.join(' y ')} (de 10 a 500 caracteres).`
              : incierta
                ? 'Si la lista difiere de la sugerida, el servidor pedirá la justificación (de 10 a 500 caracteres).'
                : 'Opcional: la lista coincide con la sugerida.'
          }
        >
          {({ id, describedby, invalid }) => (
            <textarea
              id={id}
              rows={3}
              maxLength={500}
              autoFocus={obligatoria}
              value={justificacion}
              onChange={(e) => {
                setJustificacion(e.target.value)
                setErrorJustificacion('')
              }}
              disabled={enviando}
              aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={`${CLASE_CAMPO} py-2`}
            />
          )}
        </Campo>

        {desactualizado && (
          <label className={`flex min-h-11 cursor-pointer items-start gap-3 text-sm ${CLASE_TEXTO_FUERTE}`}>
            <input
              type="checkbox"
              checked={revisada}
              onChange={(e) => setRevisada(e.target.checked)}
              disabled={enviando}
              className={`${CLASE_CHECK} mt-0.5`}
            />
            <span>Revisé la lista con el ranking actualizado.</span>
          </label>
        )}

        {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton variante="contorno" tamano="tactil" disabled={enviando} onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" tamano="tactil" ocupado={enviando} disabled={!puedeEnviar}>
            {enviando ? 'Confirmando…' : 'Confirmar finalistas'}
          </Boton>
        </div>
      </form>
    </Dialogo>
  )
}
