import { useCallback, useEffect } from 'react'
import { estadoFiltroValido } from '../lib/seleccion'

// Filtro de estado de las convocatorias de Selección, común a Preselección, Ranking y Decidir.
//  - La URL manda (?estado=): sobrevive a recargar, se comparte y funciona con atrás/adelante. Un valor que no es un estado
//    conocido se trata como «Todos los estados».
//  - Para no perderlo al pasar de un submódulo a otro (el menú lateral enlaza sin parámetros), lo último elegido se recuerda en
//    esta pestaña del navegador (sessionStorage) y se aplica SOLO al entrar sin ?estado=. Elegir «Todos» también se recuerda.
//  - Solo cambia la lista de convocatorias: no cambia permisos, alcance por ficha ni lo que cada estado permite hacer.
const CLAVE = 'spgth.seleccion.estado'

const leer = () => {
  try {
    return estadoFiltroValido(sessionStorage.getItem(CLAVE) ?? '')
  } catch {
    return ''
  }
}
const guardar = (estado) => {
  try {
    if (estado) sessionStorage.setItem(CLAVE, estado)
    else sessionStorage.removeItem(CLAVE)
  } catch {
    // Sin almacenamiento (modo privado, bloqueado) el filtro sigue funcionando por URL.
  }
}

// valorUrl: lo que dice la URL; setValores: el de useFiltrosUrl (mezcla con los demás parámetros de la pantalla).
export default function useFiltroEstadoSeleccion(valorUrl, setValores) {
  // Al entrar sin parámetro se recupera el último filtro de esta pestaña (una sola vez, al montar).
  useEffect(() => {
    if (valorUrl === '') {
      const recordado = leer()
      if (recordado) setValores({ estado: recordado })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cambiar = useCallback(
    (estado) => {
      const valido = estadoFiltroValido(estado)
      guardar(valido)
      setValores({ estado: valido })
    },
    [setValores],
  )

  return [estadoFiltroValido(valorUrl), cambiar]
}
