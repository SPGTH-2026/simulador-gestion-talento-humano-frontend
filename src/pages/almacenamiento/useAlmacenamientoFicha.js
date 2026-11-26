import { useEffect, useState } from 'react'
import { borrarDocumentos, listaDocumentosFicha } from '../../api/almacenamiento'
import { mensajeError } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'

// Documentos de una ficha: selección, borrado por lote con confirmación y el aviso de lo que quedó sin borrar.
export function useAlmacenamientoFicha(fichaId) {
  const confirmar = useConfirmacion()
  const [pagina, setPagina] = useState(1)
  const [ficha, setFicha] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [meta, setMeta] = useState({})
  const [seleccion, setSeleccion] = useState(() => new Set())
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState(null)
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let activo = true
    listaDocumentosFicha(fichaId, { page: pagina })
      .then((res) => {
        if (!activo) return
        setFicha(res.ficha ?? null)
        setDocumentos(res.data ?? [])
        setMeta(res.meta ?? {})
        setError('')
      })
      .catch((e) => {
        if (activo) setError(mensajeError(e))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [fichaId, pagina, recarga])

  // Cambiar de página vacía la selección: lo marcado en otra página no se borra por accidente.
  const irAPagina = (n) => {
    setSeleccion(new Set())
    setCargando(true)
    setPagina(n)
  }

  const alternar = (id) => {
    setSeleccion((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)

      return siguiente
    })
  }

  // Marca o desmarca solo los que se pueden borrar de esta página (los obligatorios nunca entran).
  const alternarTodos = () => {
    const borrables = documentos.filter((d) => d.borrable).map((d) => d.id)
    setSeleccion((prev) => {
      const todos = borrables.every((id) => prev.has(id))

      return todos ? new Set() : new Set(borrables)
    })
  }

  const borrarSeleccion = async () => {
    const ids = [...seleccion]
    if (ids.length === 0 || ocupado) return

    const ok = await confirmar({
      titulo: 'Borrar documentos',
      mensaje: `Vas a borrar ${ids.length} documento(s) de la ficha ${ficha?.codigo ?? ''} y sus archivos. No se puede deshacer.`,
      textoConfirmar: 'Borrar',
      peligro: true,
    })
    if (!ok) return

    setOcupado(true)
    setError('')
    setAviso(null)
    try {
      const resultado = await borrarDocumentos(ids)
      setSeleccion(new Set())
      setAviso({ borrados: resultado.borrados.length, omitidos: resultado.omitidos })
      setCargando(true)
      setRecarga((n) => n + 1)
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setOcupado(false)
    }
  }

  const borrablesEnPagina = documentos.filter((d) => d.borrable)
  const todosMarcados = borrablesEnPagina.length > 0 && borrablesEnPagina.every((d) => seleccion.has(d.id))

  return {
    alternar,
    alternarTodos,
    aviso,
    borrarSeleccion,
    cargando,
    documentos,
    error,
    ficha,
    irAPagina,
    meta,
    ocupado,
    seleccion,
    todosMarcados,
  }
}
