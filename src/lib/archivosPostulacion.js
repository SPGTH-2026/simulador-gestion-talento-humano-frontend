// Reglas de los archivos adjuntos de una postulación. Subida SIMULADA: el front
// solo valida en el cliente y NO envía archivos al backend.
//
// Los valores espejan la configuración del backend (fuente única):
//   C:\ADSO_TOCORA\SPGTH\simulador_gestion_talento_humano_backend\config\convocatorias.php
//     'formatos_permitidos' => ['pdf']
//     'tamano_maximo_mb'    => 3
// Si algún día el backend expone estos valores por API, esta constante debe
// leerse de ahí en vez de copiarse.

export const TAMANO_MAXIMO_MB = 3
export const TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024

// Valida un archivo elegido en el cliente (PDF + tamaño máximo).
// Devuelve { ok: true, nombre } o { ok: false, mensaje } con el mensaje en
// español, listo para pintar junto a la fila del documento.
export function validarArchivoPostulacion(archivo) {
  if (!archivo) return { ok: false, mensaje: '' }

  const esPdf =
    archivo.type === 'application/pdf' ||
    String(archivo.name).toLowerCase().endsWith('.pdf')

  if (!esPdf) {
    return { ok: false, mensaje: 'Solo se permiten archivos PDF.' }
  }

  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, mensaje: `El archivo no puede superar ${TAMANO_MAXIMO_MB} MB.` }
  }

  return { ok: true, nombre: archivo.name }
}