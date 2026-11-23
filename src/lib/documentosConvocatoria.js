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

// Etiquetas de los documentos que tienen una regla propia de aplicación (hoy solo la libreta militar). La obligatoriedad NO
// se dice aquí: es la que quedó guardada en la convocatoria (el backend guarda como obligatorio todo documento que el
// gestor incluye) y se muestra con «Obligatorio» / «(opcional)». Una etiqueta como «Si el cargo la exige» la repetía o la
// contradecía, por eso la tarjeta profesional ya no lleva etiqueta propia.
export const ETIQUETAS_DOCUMENTO = {
  libreta_militar: 'Solo para hombres',
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
