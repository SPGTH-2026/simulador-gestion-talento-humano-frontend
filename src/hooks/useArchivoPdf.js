import { useCallback, useEffect, useState } from 'react'
import { obtenerArchivo } from '../api/archivos'
import { mensajeErrorBlob } from '../api/postulacionesDocumentos'
import { comoPdf } from '../lib/visorPdf'

const ERROR_GENERICO = 'No se pudo cargar el documento. Revisa tu conexión e inténtalo de nuevo.'

// Trae el archivo de `ruta` y comprueba que sea un PDF por su contenido.
// Estados: 'cargando' | 'listo' (blob es un PDF) | 'no_pdf' (llegó algo que no es PDF; blob es el original, solo descargable) | 'error'.
//  - Cancela la petición al cambiar de ruta, cerrar o reintentar, y descarta cualquier respuesta que llegue fuera de orden.
//  - Reutiliza el blob ya traído para abrir y descargar: no se vuelve a pedir el archivo.
export default function useArchivoPdf(ruta) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState({ ruta: null, intento: -1, estado: 'cargando', blob: null, mensaje: '' })

  useEffect(() => {
    const control = new AbortController()
    let vigente = true
    const terminar = (datos) => {
      if (vigente) setResultado({ ruta, intento, ...datos })
    }
    obtenerArchivo(ruta, { signal: control.signal })
      .then(async (blob) => {
        const pdf = await comoPdf(blob)
        terminar(pdf ? { estado: 'listo', blob: pdf, mensaje: '' } : { estado: 'no_pdf', blob, mensaje: '' })
      })
      .catch(async (error) => {
        if (!vigente || control.signal.aborted || error?.code === 'ERR_CANCELED') return
        terminar({ estado: 'error', blob: null, mensaje: (await mensajeErrorBlob(error)) || ERROR_GENERICO })
      })
    return () => {
      vigente = false
      control.abort()
    }
  }, [ruta, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  // Un resultado de otra ruta o de un intento anterior no cuenta: mientras tanto se está cargando.
  const actual = resultado.ruta === ruta && resultado.intento === intento
  return actual ? { ...resultado, reintentar } : { estado: 'cargando', blob: null, mensaje: '', reintentar }
}
