import { useCallback, useRef } from 'react'
import { estadoDocumentos } from '../../api/postulacionesDocumentos'

// Lectura del estado de documentos de una postulación, con las guardas que necesita el panel:
//  - orden: dos lecturas en vuelo pueden terminar al revés; una respuesta más vieja que otra ya aplicada no pisa el estado
//    más reciente (antes la lectura anterior al guardado de una skill podía dejar la fila con la respuesta de antes).
//  - idVigente: id de la postulación aunque el render siguiente aún no lo vea. Al crear el borrador silencioso, las secciones
//    conservan el «recargar» del render anterior; con el id aquí ese «recargar» sí relee la postulación recién creada.
//  - yaLeido: el borrador recién creado ya trae su estado aplicado, así que el efecto por id nuevo no lo pide otra vez.
export function useLecturaEstado(aplicarEstado, idInicial) {
  const orden = useRef({ pedida: 0, aplicada: 0 })
  const creada = useRef({ id: idInicial, leida: false })

  const leerEstado = useCallback(
    (id) => {
      const numero = ++orden.current.pedida
      return estadoDocumentos(id).then((data) => {
        if (numero > orden.current.aplicada) {
          orden.current.aplicada = numero
          aplicarEstado(data)
        }
        return data
      })
    },
    [aplicarEstado],
  )

  // Se llama al crear el borrador, antes de cambiar el id en el estado de React.
  const registrarCreada = useCallback((id, leida) => {
    creada.current = { id, leida }
  }, [])
  const idVigente = useCallback(() => creada.current.id, [])
  const yaLeido = useCallback((id) => creada.current.leida && creada.current.id === id, [])

  return { leerEstado, registrarCreada, idVigente, yaLeido }
}
