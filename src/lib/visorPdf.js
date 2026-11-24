// Utilidades del visor de PDF: validación del contenido y URL locales.

const FIRMA_PDF = '%PDF-'

// Un PDF de verdad empieza por «%PDF-» (puede haber unos bytes de relleno antes, la especificación admite hasta 1024).
// No se confía en el tipo MIME que dijo el servidor: se mira el contenido.
export async function esPdf(blob) {
  if (!(blob instanceof Blob) || blob.size < FIRMA_PDF.length) return false
  const cabecera = new TextDecoder('latin1').decode(await blob.slice(0, 1024).arrayBuffer())
  return cabecera.includes(FIRMA_PDF)
}

// Devuelve el blob como application/pdf (el servidor puede haberlo etiquetado distinto) o null si no es un PDF.
export async function comoPdf(blob) {
  if (!(await esPdf(blob))) return null
  return blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' })
}

// Registro de URL para «Abrir en otra pestaña». Es aparte de la URL del visor: al cerrar el diálogo se libera la del iframe,
// pero la pestaña ya abierta necesita la suya viva. Se reutiliza por blob y se libera al cerrar o recargar la aplicación
// (pagehide); las pestañas abiertas desde aquí siguen funcionando mientras la aplicación siga abierta.
const urlsDePestana = new Map()

export function urlParaPestana(blob) {
  let url = urlsDePestana.get(blob)
  if (!url) {
    url = URL.createObjectURL(blob)
    urlsDePestana.set(blob, url)
  }
  return url
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    urlsDePestana.forEach((url) => URL.revokeObjectURL(url))
    urlsDePestana.clear()
  })
}
