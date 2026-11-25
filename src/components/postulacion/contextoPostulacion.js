import { createContext, useContext } from 'react'

// Estado único de la postulación del aspirante, compartido por las secciones (Datos personales, Autorización de datos y
// Documentos). Cada sección puede ir en una pestaña distinta del detalle, o todas juntas en una pantalla, sin duplicar
// peticiones ni perder lo que ya se escribió o subió. Lo arma ProveedorPostulacion.
//
// Valor: { pantalla, panel, datos, props }
//   - pantalla: mientras llega el estado (o si falla el acceso) es la propia pantalla (un elemento de React); si no, null.
//   - panel: lo que devuelve usePanelDocumentosPostulacion (estado, permisos, acciones). null si hay `pantalla`.
//   - datos: el formulario de datos personales y la autorización (useSeccionDatosPersonales).
//   - props: las props con las que se montó (onEnviado, onVerDocumentos, modoCorreccion…).
export const ContextoPostulacion = createContext(null)

export function usePostulacion() {
  const valor = useContext(ContextoPostulacion)
  if (!valor) throw new Error('usePostulacion debe usarse dentro de ProveedorPostulacion.')
  return valor
}
