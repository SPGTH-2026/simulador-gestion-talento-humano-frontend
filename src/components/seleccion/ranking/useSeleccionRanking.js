
import { rankingConvocatoria } from '../../../api/seleccion'
import { mensajeError } from '../../../api/mensajeError'

// Bloque de usePanelRanking movido a su propio hook. Recibe sus dependencias en `deps`.
export function useSeleccionRanking(deps) {
  const { borradorActual, cargadoClave, convocatoriaId, filas, intentoActual, meta, montado, onConfirmada, paginaActual, recargar, seleccionActual, setAviso, setBorrador, setBuscando, setDesactualizado, setEstado, setPagina, setRevision, setSeleccion, sugeridosEnCache, versionVista } = deps
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

  return {
    abrirRevision,
    alConfirmar,
    alRankingDesactualizado,
    alternar,
    leerRankingCompleto,
    leerSugeridos,
    limpiar,
    manejarCambioDeRanking,
    sincronizar,
    usarSugerencia,
  }
}
