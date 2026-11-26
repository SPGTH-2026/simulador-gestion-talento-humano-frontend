import { useEffect, useState } from 'react'
import { borrarDocumentos, listaDocumentosFicha, listaIdsBorrablesFicha } from '../../api/almacenamiento'
import { mensajeError } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import useDebounce from '../../lib/useDebounce'

// Documentos de una ficha: búsqueda y filtro de tipo, selección (de la página o de todos los resultados), borrado por
// lote con confirmación y el aviso de lo que quedó sin borrar.
export function useAlmacenamientoFicha(fichaId) {
  const confirmar = useConfirmacion()
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')
  // La búsqueda pide al servidor solo cuando el usuario deja de escribir (no en cada tecla).
  const busquedaDiferida = useDebounce(busqueda, 300)
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
    const params = { page: pagina }
    if (busquedaDiferida.trim()) params.q = busquedaDiferida.trim()
    if (tipo) params.tipo = tipo

    listaDocumentosFicha(fichaId, params)
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
  }, [fichaId, pagina, busquedaDiferida, tipo, recarga])

  // Cualquier cambio de búsqueda, filtro o página vacía la selección: no se borra nada que no se vea marcado.
  const reiniciarSeleccion = () => setSeleccion(new Set())

  const irAPagina = (n) => {
    reiniciarSeleccion()
    setCargando(true)
    setPagina(n)
  }

  const cambiarBusqueda = (valor) => {
    reiniciarSeleccion()
    setPagina(1)
    setBusqueda(valor)
  }

  const cambiarTipo = (valor) => {
    reiniciarSeleccion()
    setPagina(1)
    setTipo(valor)
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

  // Marca TODOS los que se pueden borrar de la búsqueda actual, aunque estén en otras páginas.
  const seleccionarTodosLosResultados = async () => {
    if (ocupado) return
    setError('')
    try {
      const params = {}
      if (busquedaDiferida.trim()) params.q = busquedaDiferida.trim()
      if (tipo) params.tipo = tipo
      const resultado = await listaIdsBorrablesFicha(fichaId, params)
      setSeleccion(new Set(resultado.ids))
    } catch (e) {
      setError(mensajeError(e))
    }
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
    busqueda,
    cambiarBusqueda,
    cambiarTipo,
    cargando,
    documentos,
    error,
    ficha,
    irAPagina,
    meta,
    ocupado,
    seleccion,
    seleccionarTodosLosResultados,
    tipo,
    todosMarcados,
  }
}
