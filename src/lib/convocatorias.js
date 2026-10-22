// Reglas de estado de una convocatoria, compartidas por el listado y por la
// vista de gestión del detalle.
//
// El candado avanza UN paso del ciclo de vida: borrador -> publicada ->
// en_proceso -> cerrada. Desde 'publicada' pasa a 'en_proceso' y desde
// 'en_proceso' a 'cerrada'.
//
// La etiqueta es SIEMPRE "Cerrar convocatoria": es la acción que ve el gestor,
// no el detalle interno del estado. Los códigos de destino son los del
// backend y no se inventan transiciones.
//
// Se resuelve SIEMPRE por código de estado (nunca por id ni por nombre).

export const PASOS_CANDADO = {
  publicada: { etiqueta: 'Cerrar convocatoria', destino: 'en_proceso' },
  en_proceso: { etiqueta: 'Cerrar convocatoria', destino: 'cerrada' },
}

/** Estados en los que la convocatoria todavía se puede editar. */
export const ESTADOS_EDITABLES = ['borrador', 'publicada']

/**
 * Siguiente paso del candado para una convocatoria, o null si ya está
 * cerrada (o si el estado no permite avanzar).
 */
export function pasoDeEstado(codigoEstado) {
  return PASOS_CANDADO[codigoEstado] ?? null
}

/** ¿Se puede editar esta convocatoria? */
export function esEditable(convocatoria) {
  return ESTADOS_EDITABLES.includes(convocatoria?.estado?.codigo)
}

// El identificador de la convocatoria (CONV-AAAA-NNN) es un dato de GESTIÓN.
//
// Lista blanca de quién lo ve: instructor, super admin y el aprendiz con el
// subrol 'gestor_convocatorias'. El permiso 'convocatorias:gestionar' NO
// alcanza por sí solo: el aprendiz con el subrol 'general' también lo tiene
// (ver config/permissions.php del backend) y no debe ver el identificador.
// Por eso se comprueban las dos cosas. No se usa "role !== aspirante": esa
// comprobación negativa dejaría pasar al aprendiz general.
//
// El backend aplica la MISMA lista: si aquí no se ve, la API tampoco lo envía.
export function veIdentificador(user, can) {
  if (!can('convocatorias:gestionar')) return false
  if (user?.role === 'instructor' || user?.role === 'super_admin') return true
  return user?.role === 'aprendiz' && user?.subrole === 'gestor_convocatorias'
}
