import { useEffect, useState } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import useFiltrosUrl from '../../../hooks/useFiltrosUrl'
import { CLAVES_FILTRO, ORDENES } from './constantesListado'

// Filtros del listado: búsqueda, estado, ficha, tipo, modalidad, orden y página viven en la URL, así que
// sobreviven a recargar, a "atrás" y al regreso del detalle. Devuelve sus valores vigentes y cómo cambiarlos.
export function useFiltrosListado() {
  // Búsqueda, filtros y página viven en la URL. 'termino' es solo el texto que
  // se está escribiendo; pasa a la URL con un antirrebote de 300 ms.
  const { valores, setValores } = useFiltrosUrl(CLAVES_FILTRO)
  const busqueda = valores.q
  const filtroEstado = valores.estado
  const filtroFicha = valores.ficha
  const filtroTipo = valores.tipo
  const filtroModalidad = valores.modalidad
  // Un orden desconocido en la URL (enlace viejo o editado) cae al predeterminado.
  const orden = ORDENES.some((o) => o.valor === valores.orden) ? valores.orden : 'reciente'
  const pagina = Math.max(1, Number.parseInt(valores.page, 10) || 1)

  // Cambiar la búsqueda o un filtro estando en la página 2 o posterior añade una
  // entrada al historial (así "atrás" vuelve a esa página); desde la página 1 la
  // reemplaza, para no llenar el historial con cada cambio.
  const reemplazar = !valores.page

  const [termino, setTermino] = useState(valores.q)
  // Cuando la búsqueda de la URL cambia, el campo debe reflejarla salvo que el
  // cambio lo haya escrito este mismo componente (el campo ya lo tiene, y puede
  // incluso ir por delante si se siguió escribiendo). Se sabe con la propia
  // navegación: lo escrito aquí lleva 'state.origen = buscador' y NO es un "atrás" o
  // "adelante" (POP): las entradas del historial conservan su 'state', así que
  // volver a una de ellas sí es un cambio externo. Atrás, adelante, un enlace a
  // /convocatorias y limpiar actualizan el campo; no hace falta recordar nada
  // entre un render y otro.
  const ubicacion = useLocation()
  const tipoNavegacion = useNavigationType()
  const [qVista, setQVista] = useState(valores.q)
  if (valores.q !== qVista) {
    setQVista(valores.q)
    const loEscribioElBuscador =
      tipoNavegacion !== 'POP' && ubicacion.state?.origen === 'buscador'
    if (!loEscribioElBuscador) setTermino(valores.q)
  }

  // El texto se aplaza 300 ms para no martillar el backend letra a letra. Solo
  // se escribe en la URL si difiere de la búsqueda vigente, y cambiarla vuelve a
  // la primera página.
  useEffect(() => {
    const t = setTimeout(() => {
      if (termino !== valores.q) {
        setValores({ q: termino, page: '' }, { reemplazar, state: { origen: 'buscador' } })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [termino, valores.q, reemplazar, setValores])

  // Limpiar quita búsqueda, filtros y orden de una vez, al instante (sin esperar
  // los 300 ms) y vuelve a la primera página.
  const limpiarFiltros = () => {
    setTermino('')
    setValores({ q: '', estado: '', ficha: '', tipo: '', modalidad: '', orden: '', page: '' }, { reemplazar })
  }

  const hayFiltros = Boolean(
    termino || filtroFicha || filtroEstado || filtroTipo || filtroModalidad || orden !== 'reciente',
  )

  return {
    busqueda, filtroEstado, filtroFicha, filtroTipo, filtroModalidad, orden, pagina, reemplazar,
    termino, setTermino, setValores, limpiarFiltros, hayFiltros,
  }
}
