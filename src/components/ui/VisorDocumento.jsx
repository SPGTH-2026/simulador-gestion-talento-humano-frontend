import { useEffect, useId, useRef, useState } from 'react'
import Dialogo from './Dialogo'
import Boton from './Boton'
import CabeceraVisor from './CabeceraVisor'
import Rueda from './Rueda'
import { Hueco } from './Esqueleto'
import { MensajeAviso, MensajeError } from './Mensaje'
import useArchivoPdf from '../../hooks/useArchivoPdf'
import { dispararDescarga } from '../../api/postulacionesDocumentos'
import { urlParaPestana } from '../../lib/visorPdf'

// Visor de documentos dentro de la aplicación: un diálogo con el PDF en un <iframe> sobre un blob local.
// Siempre se abre el diálogo; si el PDF no puede mostrarse, el aviso y las alternativas (abrir en otra pestaña, descargar)
// siguen disponibles. Nunca abre una pestaña por su cuenta.
//  - `ruta`: ruta autorizada del backend (propia del aspirante o de revisión por ficha). `titulo`: lo que se lee en la cabecera.
//  - Cerrar libera la URL del iframe; la de «Abrir en otra pestaña» es aparte (lib/visorPdf) para no romper una pestaña ya abierta.
//  - Sin `sandbox` en el iframe: el visor de PDF de Chrome no funciona dentro de uno. El contenido ya se comprobó (firma %PDF-)
//    y el blob nace en este origen; no se muestra HTML ni otros tipos.
export default function VisorDocumento({ ruta, titulo, nombre, onCerrar }) {
  const idTitulo = useId()
  const { estado, blob, mensaje, reintentar } = useArchivoPdf(ruta)
  const [forzar, setForzar] = useState(false)
  const marco = useRef(null)
  const botonCerrar = useRef(null)
  const sinVisorIntegrado = typeof navigator !== 'undefined' && navigator.pdfViewerEnabled === false
  const mostrar = estado === 'listo' && (!sinVisorIntegrado || forzar)

  // URL propia del iframe: se libera al cerrar, al cambiar de documento o al volver a ocultarlo.
  useEffect(() => {
    if (!mostrar || !marco.current) return undefined
    const url = URL.createObjectURL(blob)
    const iframe = marco.current
    // Preferencias de apertura del visor nativo (no una garantía de compatibilidad móvil): en pantallas estrechas o bajas se pide
    // arrancar sin el panel de miniaturas y con la página ajustada al ancho. Si el navegador no las respeta o no pinta el PDF,
    // «Abrir en otra pestaña» y «Descargar» siguen disponibles mientras el archivo esté cargado.
    const compacto = window.matchMedia?.('(max-width: 767px), (max-height: 520px)').matches
    iframe.src = compacto ? `${url}#navpanes=0&view=FitH` : url
    return () => {
      iframe.removeAttribute('src')
      URL.revokeObjectURL(url)
    }
  }, [mostrar, blob])

  // El visor de PDF del navegador toma el foco por su cuenta al cargar y, con el foco dentro del iframe, Escape no llega a la
  // página (límite del visor nativo). Se devuelve a «Cerrar» UNA sola vez y solo si ocurre durante los primeros 3 s desde que se
  // pidió pintar el PDF; sin temporizadores repetidos. Pasado ese margen, un clic o Tab dentro del PDF es del usuario y no se toca.
  // Dentro del PDF, Escape no se garantiza: «Cerrar» sigue accesible con Shift+Tab desde la barra del visor.
  useEffect(() => {
    if (!mostrar) return undefined
    const desde = Date.now()
    const recuperar = () => {
      window.removeEventListener('blur', recuperar)
      if (Date.now() - desde < 3000 && document.activeElement === marco.current) botonCerrar.current?.focus()
    }
    window.addEventListener('blur', recuperar)
    return () => window.removeEventListener('blur', recuperar)
  }, [mostrar])

  const nombreArchivo = nombre || titulo || 'documento.pdf'
  const abrirEnPestana = () => window.open(urlParaPestana(blob), '_blank', 'noopener')
  const descargar = () => dispararDescarga(blob, nombreArchivo)

  return (
    <Dialogo idTitulo={idTitulo} onCerrar={onCerrar} className="flex h-[calc(100dvh-2rem)] max-w-5xl flex-col overflow-hidden!">
      <CabeceraVisor
        idTitulo={idTitulo}
        titulo={titulo}
        nombre={nombre}
        onAbrir={abrirEnPestana}
        onDescargar={descargar}
        puedeAbrir={estado === 'listo'}
        puedeDescargar={Boolean(blob)}
        onCerrar={onCerrar}
        botonCerrar={botonCerrar}
      />

      <div className="flex min-h-0 flex-1 flex-col bg-sena-hundido dark:bg-sena-superficie">
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
            <MensajeAviso>Este archivo no es un PDF que pueda mostrarse aquí. Puedes descargarlo.</MensajeAviso>
          </div>
        )}

        {estado === 'listo' && !mostrar && (
          <div className="space-y-3 p-4">
            <MensajeAviso>
              Este navegador no muestra PDF dentro de la página. Puedes abrirlo en otra pestaña, descargarlo o intentar mostrarlo aquí.
            </MensajeAviso>
            <Boton variante="contorno" onClick={() => setForzar(true)}>
              Intentar mostrarlo aquí
            </Boton>
          </div>
        )}

        {mostrar && <iframe ref={marco} title={titulo || nombre || 'Documento'} className="min-h-0 w-full flex-1 border-0 bg-white" />}
      </div>

      {estado === 'listo' && (
        <p className="hidden border-t border-sena-linea px-4 py-2 text-xs [@media(min-width:768px)_and_(min-height:560px)]:block text-slate-600 dark:text-sena-texto-suave dark:border-sena-borde">
          ¿No se ve el documento? Ábrelo en otra pestaña o descárgalo con los botones de arriba.
        </p>
      )}
    </Dialogo>
  )
}
