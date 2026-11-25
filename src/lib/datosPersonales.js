// Reglas y valores iniciales del formulario de datos personales de una postulación. Las reglas de edad se repiten aquí
// solo para avisar al instante; el servidor es quien las exige.

export const EDAD_MINIMA = 16
export const MAYORIA_DE_EDAD = 18

// Solo 'hombre' y 'mujer' (códigos del tema 'sexo' en el backend).
export const OPCIONES_SEXO = [
  { codigo: 'hombre', nombre: 'Masculino' },
  { codigo: 'mujer', nombre: 'Femenino' },
]

export const ID_SECCION_DATOS = 'seccion-datos-personales'
export const ID_SECCION_AUTORIZACION = 'seccion-autorizacion-datos'

export const FORM_VACIO = {
  sexo: '',
  tipo_documento_identidad: '',
  numero_documento: '',
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  telefono: '',
  departamento: '',
  municipio: '',
  direccion: '',
  nivel_formacion: '',
  representante_nombre: '',
  representante_documento: '',
  representante_telefono: '',
  representante_parentesco: '',
  acepta_tratamiento_datos: false,
}

export const CAMPOS_REPRESENTANTE = [
  'representante_nombre',
  'representante_documento',
  'representante_telefono',
  'representante_parentesco',
]

// Edad en años cumplidos a una fecha 'AAAA-MM-DD'; null si la fecha no es válida o es futura.
export function edadDe(fecha, hoy = new Date()) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha ?? '')
  if (!partes) return null
  const [, anio, mes, dia] = partes.map(Number)
  const nacimiento = new Date(anio, mes - 1, dia)
  if (nacimiento.getFullYear() !== anio || nacimiento.getMonth() !== mes - 1 || nacimiento > hoy) return null

  let edad = hoy.getFullYear() - anio
  if (hoy.getMonth() < mes - 1 || (hoy.getMonth() === mes - 1 && hoy.getDate() < dia)) edad -= 1
  return edad
}

// 'sin_fecha' | 'bajo_minimo' (no puede continuar) | 'menor' (16 y 17: lleva representante) | 'mayor'.
export function categoriaDeEdad(fecha, hoy = new Date()) {
  const edad = edadDe(fecha, hoy)
  if (edad === null) return 'sin_fecha'
  if (edad < EDAD_MINIMA) return 'bajo_minimo'
  return edad < MAYORIA_DE_EDAD ? 'menor' : 'mayor'
}

// Campos que el servidor exige siempre (el representante solo con 16 o 17 años).
const OBLIGATORIOS = [
  'sexo', 'tipo_documento_identidad', 'numero_documento', 'nombres', 'apellidos', 'fecha_nacimiento', 'telefono',
  'departamento', 'municipio', 'nivel_formacion',
]

// ¿Están todos los campos obligatorios llenos? Sirve para no guardar solos datos a medias.
export function formCompleto(form, hoy = new Date()) {
  const obligatorios = categoriaDeEdad(form.fecha_nacimiento, hoy) === 'menor' ? [...OBLIGATORIOS, ...CAMPOS_REPRESENTANTE] : OBLIGATORIOS
  return obligatorios.every((campo) => String(form[campo] ?? '').trim() !== '')
}

// Valores del formulario a partir de lo guardado en la postulación (o vacío si aún no hay datos).
export function formDesdeDatos(datos) {
  if (!datos) return { ...FORM_VACIO }
  return {
    ...FORM_VACIO,
    ...Object.fromEntries(
      Object.entries(datos).filter(([campo, valor]) => campo in FORM_VACIO && valor !== null && typeof valor !== 'object'),
    ),
    tipo_documento_identidad: datos.tipo_documento_identidad?.codigo ?? '',
    // El servidor devuelve { codigo, nombre }; el formulario trabaja con los códigos oficiales (DIVIPOLA).
    departamento: datos.departamento?.codigo ?? '',
    municipio: datos.municipio?.codigo ?? '',
    nivel_formacion: datos.nivel_formacion?.codigo ?? '',
  }
}

// Cuerpo del PUT: sin los datos del representante si la persona es mayor de edad.
export function cuerpoDesdeForm(form, hoy = new Date()) {
  const cuerpo = { ...form }
  if (categoriaDeEdad(form.fecha_nacimiento, hoy) !== 'menor') {
    CAMPOS_REPRESENTANTE.forEach((campo) => delete cuerpo[campo])
  }
  return cuerpo
}
