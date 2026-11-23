// Reglas de los documentos mientras hay una corrección vigente. Espejo de lo que hace el servidor
// (GestionaPostulacionPropia::exigirSinCorreccionVigente y GuardaDocumentos): solo se reemplazan los documentos marcados
// por el evaluador y no se elimina ninguno. Fuera de una corrección no bloquea nada.
export const MOTIVO_SOLO_MARCADOS = 'Durante la corrección solo puedes reemplazar los documentos que el evaluador marcó.'
export const MOTIVO_SIN_ELIMINAR = 'Durante la corrección no se eliminan documentos: reemplázalo por otro archivo.'

// bloqueoCorreccion: hay una ronda vigente. marcado: el evaluador pidió corregir este documento.
export function reglasCorreccionDocumento({ bloqueoCorreccion = false, marcado = false } = {}) {
  const bloqueadoReemplazo = Boolean(bloqueoCorreccion) && !marcado
  return {
    bloqueadoReemplazo,
    motivoReemplazo: bloqueadoReemplazo ? MOTIVO_SOLO_MARCADOS : '',
    eliminarBloqueado: Boolean(bloqueoCorreccion),
    motivoEliminar: bloqueoCorreccion ? (marcado ? MOTIVO_SIN_ELIMINAR : MOTIVO_SOLO_MARCADOS) : '',
  }
}
