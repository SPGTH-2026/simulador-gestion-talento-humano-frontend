import { useEffect } from 'react'
import { esEditable } from '../lib/foco'

// El marco autenticado ya es tan alto como la pantalla y su contenido se desplaza por dentro: el documento no debería moverse nunca.
// La excepción es el teclado del teléfono: al abrirlo, iOS desplaza el documento para dejar visible el campo (eso se respeta) y, a
// veces, al cerrarlo lo deja desplazado, con la barra superior fuera de vista. Solo se devuelve a 0 ese desplazamiento accidental:
//  - no hay un campo editable enfocado (con el teclado abierto o al pasar de un campo a otro no se toca);
//  - no hay zoom de pellizco (con zoom, mover la vista es legítimo);
//  - no hay texto seleccionado ni un dedo apoyado (no se compite con la selección ni con un gesto en curso).
// El desplazamiento propio del contenido no se toca: solo se mira el del documento. Solo vive mientras el marco autenticado está
// montado; no fija el documento ni bloquea nada.
const ESPERA_MS = 120

export function hayMotivoParaNoTocar(documento = document, visual = window.visualViewport, tocando = false) {
  if (esEditable(documento.activeElement)) return true
  if (visual && visual.scale > 1.01) return true
  if (tocando) return true
  const seleccion = window.getSelection?.()
  return Boolean(seleccion && !seleccion.isCollapsed && String(seleccion).length > 0)
}

export default function useDocumentoSinDesplazar() {
  useEffect(() => {
    let espera = null
    let tocando = false
    const restaurar = () => {
      clearTimeout(espera)
      espera = setTimeout(() => {
        const documento = document.scrollingElement
        if (!documento || documento.scrollTop === 0) return
        if (hayMotivoParaNoTocar(document, window.visualViewport, tocando)) return
        documento.scrollTop = 0
      }, ESPERA_MS)
    }
    const alTocar = () => {
      tocando = true
    }
    const alSoltar = (e) => {
      tocando = (e.touches?.length ?? 0) > 0
    }
    const visual = window.visualViewport
    document.addEventListener('focusout', restaurar)
    document.addEventListener('touchstart', alTocar, { passive: true })
    document.addEventListener('touchend', alSoltar, { passive: true })
    document.addEventListener('touchcancel', alSoltar, { passive: true })
    visual?.addEventListener('resize', restaurar)
    return () => {
      clearTimeout(espera)
      document.removeEventListener('focusout', restaurar)
      document.removeEventListener('touchstart', alTocar)
      document.removeEventListener('touchend', alSoltar)
      document.removeEventListener('touchcancel', alSoltar)
      visual?.removeEventListener('resize', restaurar)
    }
  }, [])
}
