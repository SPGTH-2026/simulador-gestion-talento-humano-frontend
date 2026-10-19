// Documentos de convocatoria: espejo de la regla del backend
// (config/convocatorias.php). El endpoint /parametros NO expone la
// obligatoriedad, así que el frontend mantiene aquí los códigos fijos y las
// etiquetas especiales para poder marcarlos, bloquearlos y etiquetarlos igual
// en el wizard (etapa 5), el detalle y la sección de subida del aspirante.
//
// Manda el backend: si la config cambia, hay que actualizar estas constantes.

// Documentos SIEMPRE obligatorios: el backend los agrega solo y el gestor no
// los puede quitar. Se resuelven por código del tema tipo_documento.
export const DOCUMENTOS_OBLIGATORIOS = [
  'hoja_de_vida',
  'documento_identidad',
  'certificados_academicos', // nombre visible: "Certificados de estudio"
  'certificados_laborales',
]

// Etiquetas de los documentos opcionales que tienen regla propia. Los decide el
// gestor; si los incluye, el backend los guarda como obligatorios.
export const ETIQUETAS_DOCUMENTO = {
  libreta_militar: 'Solo masculino',
  tarjeta_profesional: 'Si el cargo la exige',
}

// ¿Es uno de los obligatorios fijos (marcado y bloqueado, no se puede quitar)?
export function esObligatorioFijo(codigo) {
  return DOCUMENTOS_OBLIGATORIOS.includes(codigo)
}

// Etiquetas de un documento, en orden. "Obligatorio" se muestra para los fijos
// o cuando el backend reporta obligatorio = true; después, la regla especial
// de libreta_militar / tarjeta_profesional si aplica.
export function etiquetasDocumento(codigo, obligatorio = false) {
  const etiquetas = []
  if (esObligatorioFijo(codigo) || obligatorio) etiquetas.push('Obligatorio')
  const especial = ETIQUETAS_DOCUMENTO[codigo]
  if (especial) etiquetas.push(especial)
  return etiquetas
}
