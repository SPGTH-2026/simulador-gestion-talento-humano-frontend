// Catálogos y etiquetas de Usuarios: roles, subroles, tonos de los chips y textos legibles.

export const ROLES = [
  { valor: 'super_admin', etiqueta: 'Super admin' },
  { valor: 'instructor', etiqueta: 'Instructor' },
  { valor: 'aprendiz', etiqueta: 'Aprendiz' },
  { valor: 'aspirante', etiqueta: 'Aspirante' },
]

export const SUBROLES = [
  { valor: 'general', etiqueta: 'General' },
  { valor: 'evaluador', etiqueta: 'Evaluador' },
  { valor: 'seleccionador', etiqueta: 'Seleccionador' },
  { valor: 'gestor_convocatorias', etiqueta: 'Gestor de convocatorias' },
]

// Tonos del sistema para los chips de rol y de estado de la cuenta.
export const TONOS_ROL = {
  super_admin: 'peligro',
  instructor: 'aviso',
  aprendiz: 'azul',
  aspirante: 'neutral',
}

export function etiquetaRol(rol) {
  return ROLES.find((r) => r.valor === rol)?.etiqueta ?? rol
}

export function etiquetaSubrol(subrol) {
  return SUBROLES.find((s) => s.valor === subrol)?.etiqueta ?? subrol
}
