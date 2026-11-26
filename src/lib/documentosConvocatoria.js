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

// Checklist predeterminado de cada documento (un ítem por línea). Al crear una convocatoria el wizard lo
// precarga; el gestor puede cambiarlo. Son los ítems que el evaluador marca como Cumple / No cumple.
export const CHECKLIST_POR_DEFECTO = {
  hoja_de_vida: [
    'Datos personales completos (nombre, documento, dirección, teléfono, correo)',
    'Formación académica registrada',
    'Experiencia laboral con cargo y fechas',
    'Firmada',
  ].join('\n'),
  documento_identidad: ['Fotocopia legible', 'Documento vigente (no vencido)', 'Datos coinciden con la hoja de vida'].join('\n'),
  certificados_academicos: [
    'Certificado de bachiller',
    'Certificado de tecnólogo o profesional (si el cargo lo pide)',
    'Certificados de educación informal (si los tiene)',
    'Certificados legibles y con firma o sello de la institución',
  ].join('\n'),
  certificados_laborales: [
    'Certificación laboral',
    'Indica cargo, funciones y fechas de inicio y fin',
    'Firmada por el empleador, con datos de contacto',
  ].join('\n'),
  libreta_militar: ['Fotocopia legible', 'Situación militar definida'].join('\n'),
  tarjeta_profesional: ['Fotocopia legible', 'Vigente (no vencida)'].join('\n'),
}

// Ítems de un checklist (texto con un ítem por línea) sin líneas vacías.
export function itemsDeTexto(texto) {
  return String(texto ?? '')
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => linea !== '')
}

// Ítems fijos de un documento: los del checklist predeterminado. No se pueden quitar.
export function itemsFijos(codigo) {
  return itemsDeTexto(CHECKLIST_POR_DEFECTO[codigo] ?? '')
}

// Un documento básico siempre lleva sus ítems fijos al principio; los que ya tenía guardados se conservan detrás.
export function checklistConFijos(codigo, texto) {
  const fijos = itemsFijos(codigo)
  if (fijos.length === 0) return String(texto ?? '')
  const propios = itemsDeTexto(texto).filter((linea) => !fijos.includes(linea))
  return [...fijos, ...propios].join('\n')
}

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
