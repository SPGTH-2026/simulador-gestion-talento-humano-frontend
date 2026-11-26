// Constantes y funciones puras del asistente de convocatorias (sin estado ni efectos).
// Se separaron de ConvocatoriaWizard.jsx: el componente las importa de aquí.

import { DOCUMENTOS_OBLIGATORIOS } from '../../lib/documentosConvocatoria'

export const ETAPAS = [
  { numero: 1, nombre: 'Información general', descripcion: 'Datos básicos del cargo y sus condiciones laborales.' },
  { numero: 2, nombre: 'Descripción', descripcion: 'Qué hará la persona que ocupe el cargo.' },
  { numero: 3, nombre: 'Requisitos', descripcion: 'Formación, experiencia y competencias que se esperan.' },
  { numero: 4, nombre: 'Skills', descripcion: 'Habilidades técnicas que pide la convocatoria. Este paso es opcional.' },
  { numero: 5, nombre: 'Fechas', descripcion: 'Cuándo abre y cierra la convocatoria, y cuándo se evalúa.' },
  {
    numero: 6,
    nombre: 'Documentos',
    descripcion: 'Qué debe entregar el aspirante y cuánto pesa cada documento en la evaluación.',
  },
]

// A qué etapa pertenece cada campo, para saltar al primer error del servidor.
export const ETAPA_DE_CAMPO = {
  nombre: 1,
  cargo: 1,
  area: 1,
  vacantes: 1,
  ficha: 1,
  ficha_id: 1,
  tipo_convocatoria: 1,
  tipo_empleo: 1,
  tipo_contrato: 1,
  modalidad: 1,
  tipo_convocatoria_id: 1,
  tipo_empleo_id: 1,
  tipo_contrato_id: 1,
  modalidad_id: 1,
  salario_min: 1,
  salario_max: 1,
  descripcion: 2,
  funciones: 2,
  responsabilidades: 2,
  perfil_requerido: 2,
  formacion: 3,
  experiencia: 3,
  competencias: 3,
  conocimientos_especificos: 3,
  skills: 4,
  fecha_apertura: 5,
  fecha_cierre: 5,
  fecha_evaluacion: 5,
  documentos: 6,
}

// Qué se exige para PUBLICAR (el contrato actual del servidor: validarPublicacion). Para guardar un BORRADOR solo se
// exige el nombre (más la ficha si hay varias) y que lo escrito sea coherente (vacantes, salarios, fechas y porcentajes).
// Los pasos se pueden recorrer con un borrador incompleto: lo que falta se señala, no se bloquea.
export const REQUERIDOS_PUBLICAR = {
  cargo: 'Escribe el cargo.',
  area: 'Escribe el área.',
  descripcion: 'Escribe la descripción del cargo.',
  fecha_apertura: 'Elige la fecha de apertura.',
  fecha_cierre: 'Elige la fecha de cierre.',
}

// Cómo se nombra cada dato en el resumen de lo que falta.
export const ROTULO_CAMPO = {
  nombre: 'Nombre',
  ficha_id: 'Ficha',
  cargo: 'Cargo',
  area: 'Área',
  vacantes: 'Número de vacantes',
  salario_max: 'Rango salarial',
  descripcion: 'Descripción del cargo',
  fecha_apertura: 'Fecha de apertura',
  fecha_cierre: 'Fecha de cierre',
  fecha_evaluacion: 'Fecha de evaluación',
  documentos: 'Porcentajes de los documentos',
}

export const TEMAS_CLASIFICACION = ['tipo_convocatoria', 'tipo_empleo', 'tipo_contrato', 'modalidad']

// Última etapa del asistente (Documentos).
export const ULTIMA_ETAPA = 6

// Tope de skills de una convocatoria: el mismo que impone el backend
// (config/convocatorias.php: skills_max).
export const MAX_SKILLS = 20

// Longitud máxima del nombre de una skill (skills_max del backend).
export const MAX_SKILL_LONGITUD = 100

// Reparte `totalPorReparto` (100 % por defecto) en partes iguales entre los documentos. El último absorbe el redondeo para que la suma
// sea exactamente 100.
export function repartoIgual(documentos, totalPorReparto = 100) {
  const total = documentos.length
  if (total === 0) return {}
  const base = Math.floor((totalPorReparto / total) * 100) / 100
  const mapa = {}
  let acumulado = 0
  documentos.forEach((codigo, indice) => {
    const valor = indice === total - 1 ? Math.round((totalPorReparto - acumulado) * 100) / 100 : base
    acumulado += valor
    mapa[codigo] = String(valor)
  })
  return mapa
}

export function soloDigitos(valor) {
  return String(valor).replace(/\D/g, '')
}

export function formatearMiles(digitos) {
  if (!digitos) return ''
  return Number(digitos).toLocaleString('es-CO')
}

export function formInicial(valores) {
  return {
    nombre: valores?.nombre ?? '',
    codigo: valores?.codigo ?? '',
    cargo: valores?.cargo ?? '',
    area: valores?.area ?? '',
    vacantes: valores?.vacantes != null ? String(valores.vacantes) : '1',
    ficha_id: valores?.ficha?.id ? String(valores.ficha.id) : '',
    tipo_convocatoria: valores?.tipo_convocatoria?.codigo ?? '',
    tipo_empleo: valores?.tipo_empleo?.codigo ?? '',
    tipo_contrato: valores?.tipo_contrato?.codigo ?? '',
    modalidad: valores?.modalidad?.codigo ?? '',
    salario_min: valores?.salario_min != null ? String(Math.round(valores.salario_min)) : '',
    salario_max: valores?.salario_max != null ? String(Math.round(valores.salario_max)) : '',
    descripcion: valores?.descripcion ?? '',
    funciones: valores?.funciones ?? '',
    responsabilidades: valores?.responsabilidades ?? '',
    perfil_requerido: valores?.perfil_requerido ?? '',
    formacion: valores?.formacion ?? '',
    experiencia: valores?.experiencia ?? '',
    competencias: valores?.competencias ?? '',
    conocimientos_especificos: valores?.conocimientos_especificos ?? '',
    fecha_apertura: valores?.fecha_apertura?.slice(0, 10) ?? '',
    fecha_cierre: valores?.fecha_cierre?.slice(0, 10) ?? '',
    fecha_evaluacion: valores?.fecha_evaluacion?.slice(0, 10) ?? '',
    // Las skills se guardan como {nombre, parametro_id}: parametro_id apunta
    // al catálogo (tema skill_catalogo) y es null en el texto libre. Al
    // editar se lee 'skills_detalle' (con el id del catálogo); si la
    // convocatoria es vieja y solo trae 'skills' (nombres), se usa esa lista.
    skills: normalizarSkillsIniciales(valores),
    // En creación se siembran los obligatorios fijos (el backend los agrega
    // igual); en edición mandan los documentos reales del backend. Sembrarlos
    // aquí no cuenta como cambio: es el estado inicial del formulario.
    documentos: Array.isArray(valores?.documentos)
      ? valores.documentos.map((d) => d.codigo ?? d.id)
      : [...DOCUMENTOS_OBLIGATORIOS],
    // Porcentaje (%) de cada documento en la evaluación de ESTA convocatoria,
    // indexado por su identificador (código de catálogo o id si es un documento
    // nuevo). Vacío = no configurado (reparto equitativo).
    ponderaciones: Object.fromEntries(
      (Array.isArray(valores?.documentos) ? valores.documentos : [])
        .filter((d) => d && (d.codigo != null || d.id != null) && d.ponderacion != null)
        .map((d) => [d.codigo ?? d.id, String(d.ponderacion)]),
    ),
    // Checklist de cada documento (texto con un ítem por línea), indexado igual que los porcentajes.
    itemsDocumentos: Object.fromEntries(
      (Array.isArray(valores?.documentos) ? valores.documentos : [])
        .filter((d) => d && (d.codigo != null || d.id != null) && d.items)
        .map((d) => [d.codigo ?? d.id, String(d.items)]),
    ),
  }
}

export function indexarCatalogos(grupos) {
  const mapa = {}
  for (const grupo of grupos ?? []) {
    mapa[grupo.tema] = grupo.parametros ?? []
  }
  return mapa
}

// Skills del formulario: siempre {nombre, parametro_id}. Acepta las tres
// formas que pueden venir del backend (skills_detalle, skills con objetos o
// skills con nombres sueltos) para que una convocatoria vieja siga editable.
export function normalizarSkillsIniciales(valores) {
  const detalle = Array.isArray(valores?.skills_detalle) ? valores.skills_detalle : null

  if (detalle) {
    return detalle
      .filter((s) => s && s.nombre)
      .map((s) => ({
        nombre: String(s.nombre).trim(),
        parametro_id: s.parametro_id ?? null,
      }))
  }

  const simples = Array.isArray(valores?.skills) ? valores.skills : []

  return simples
    .map((s) => (typeof s === 'string' ? { nombre: s.trim(), parametro_id: null } : s))
    .filter((s) => s && s.nombre)
    .map((s) => ({ nombre: String(s.nombre).trim(), parametro_id: s.parametro_id ?? null }))
}

// Clave de comparación de una skill: sin mayúsculas ni espacios sobrantes.
export function claveSkill(nombre) {
  return String(nombre ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}
