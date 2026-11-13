import { useCallback, useEffect, useState } from 'react'
import { listaConvocatoriasSeleccion } from '../api/seleccion'
import { mensajeError } from '../api/mensajeError'

// Datos (nombre, estado, vacantes, código) de la convocatoria que dice la URL. Sigue el ID de la URL y no depende de
// qué página del listado esté cargada.
//  - Si 'datos' (lo que ya se tiene: la fila que el usuario tocó) es de ese ID, no pide nada.
//  - Si no, pide solo esa convocatoria. La respuesta se guarda CON su ID y solo se usa mientras la URL siga apuntando a
//    él: una respuesta lenta de una convocatoria anterior no puede sustituir a la actual, y al cancelarse la consulta
//    vencida (cambio de ID, atrás/adelante) tampoco actualiza el estado.
//  - Si falla, 'error' trae el motivo y 'reintentar' vuelve a pedirla; al volver a ese ID más tarde también se repite.
// Devuelve { datos, cargando, error, reintentar }. 'datos' es null mientras no se conozcan o si la convocatoria no es
// del alcance del usuario (el servidor responde con una lista vacía).
export default function useConvocatoriaDeUrl(id, datos) {
  const [resultado, setResultado] = useState({ id: null, datos: null, error: '' })
  const [intento, setIntento] = useState(0)
  const yaResuelta = datos != null && String(datos.id) === String(id)

  useEffect(() => {
    if (!id || yaResuelta) return undefined
    let vigente = true
    listaConvocatoriasSeleccion({ convocatoria: id })
      .then((res) => {
        if (vigente) setResultado({ id: String(id), datos: res.data[0] ?? null, error: '' })
      })
      .catch((e) => {
        if (vigente) setResultado({ id: String(id), datos: null, error: mensajeError(e) })
      })
    return () => {
      vigente = false
    }
  }, [id, yaResuelta, intento])

  const reintentar = useCallback(() => {
    setResultado({ id: null, datos: null, error: '' })
    setIntento((n) => n + 1)
  }, [])

  // El resultado guardado solo vale para el ID al que pertenece.
  const delResultado = id && resultado.id === String(id) ? resultado : null

  return {
    datos: yaResuelta ? datos : (delResultado?.datos ?? null),
    cargando: Boolean(id) && !yaResuelta && delResultado == null,
    error: delResultado?.error ?? '',
    reintentar,
  }
}
