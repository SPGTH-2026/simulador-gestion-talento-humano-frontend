import { useEffect, useRef } from 'react'
import { Hueco } from './Esqueleto'
import Boton from './Boton'
import Rueda from './Rueda'
import { MensajeAviso, MensajeError } from './Mensaje'
import useArchivoPdf from '../../hooks/useArchivoPdf'

// Visor de un PDF dentro de la propia pantalla (no en un diálogo): se usa junto a otros controles, por ejemplo al calificar un
// documento con su checklist al lado. Trae el archivo de `ruta` (ruta autorizada del backend) y lo muestra en un <iframe> sobre
// un blob local; la URL se libera al cambiar de documento o al desmontar. `altura` es una clase de alto (el iframe llena todo).
export default function VisorEnLinea({ ruta, titulo, altura = 'h-[70vh]' }) {
  const { estado, blob, mensaje, reintentar } = useArchivoPdf(ruta)
  const marco = useRef(null)
  const sinVisorIntegrado = typeof navigator !== 'undefined' && navigator.pdfViewerEnabled === false
  const mostrar = estado === 'listo' && !sinVisorIntegrado

  useEffect(() => {
    if (!mostrar || !marco.current) return undefined
    const url = URL.createObjectURL(blob)
    const iframe = marco.current
    iframe.src = `${url}#navpanes=0&view=FitH`
    return () => {
      iframe.removeAttribute('src')
      URL.revokeObjectURL(url)
    }
  }, [mostrar, blob])

  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-sena-linea/70 bg-sena-hundido dark:border-sena-borde/50 dark:bg-sena-superficie ${altura}`}>
      {estado === 'cargando' && (
        <div role="status" className="flex flex-1 flex-col gap-3 bg-white p-4 dark:bg-sena-superficie">
          <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-sena-texto-suave">
            <Rueda /> Cargando documento…
          </span>
          <Hueco className="min-h-0 flex-1" />
        </div>
      )}
      {estado === 'error' && (
        <div className="space-y-3 p-4">
          <MensajeError>{mensaje}</MensajeError>
          <Boton variante="contorno" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}
      {estado === 'no_pdf' && (
        <div className="p-4">
          <MensajeAviso>Este archivo no es un PDF que pueda mostrarse aquí.</MensajeAviso>
        </div>
      )}
      {estado === 'listo' && !mostrar && (
        <div className="p-4">
          <MensajeAviso>Este navegador no muestra PDF dentro de la página. Usa «Ver en ventana» para abrirlo.</MensajeAviso>
        </div>
      )}
      {mostrar && <iframe ref={marco} title={titulo || 'Documento'} className="min-h-0 w-full flex-1 border-0 bg-white" />}
    </div>
  )
}
