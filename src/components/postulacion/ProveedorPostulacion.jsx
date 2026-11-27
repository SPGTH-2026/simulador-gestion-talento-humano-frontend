import { isValidElement } from 'react'
import { ContextoPostulacion } from './contextoPostulacion'
import { usePanelDocumentosPostulacion } from './usePanelDocumentosPostulacion'
import { useSeccionDatosPersonales } from './useSeccionDatosPersonales'

// Sin postulación cargada todavía no hay nada que guardar: el formulario queda bloqueado (editable = false) y esto no se llama.
const sinPostulacion = () => Promise.reject(new Error('La postulación aún no está lista.'))

// Monta UNA vez el estado de la postulación y el formulario de datos personales, y los comparte con las secciones que
// vayan dentro (en pestañas o apiladas). Recibe las mismas props que el panel de documentos.
export default function ProveedorPostulacion({ children, ...props }) {
  const ctx = usePanelDocumentosPostulacion(props)
  const pantalla = isValidElement(ctx) ? ctx : null
  const panel = pantalla ? null : ctx

  const datos = useSeccionDatosPersonales({
    datos: panel?.vista?.datos_personales?.datos ?? null,
    editable: Boolean(panel?.editableDatos),
    asegurar: panel?.asegurar ?? sinPostulacion,
    onRecargar: panel?.recargar,
    onError: panel?.setError,
  })

  // `visor`: el visor interno de PDF (un diálogo) que abren los botones «Ver» de cualquier sección; se pinta aquí una sola vez, así
  // funciona igual con las secciones apiladas que repartidas en pestañas.
  return (
    <ContextoPostulacion.Provider value={{ pantalla, panel, datos, props }}>
      {panel?.visor}
      {children}
    </ContextoPostulacion.Provider>
  )
}
