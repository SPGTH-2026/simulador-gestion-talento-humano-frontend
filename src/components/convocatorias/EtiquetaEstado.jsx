import Etiqueta from '../ui/Etiqueta'

// Etiqueta de estado de una convocatoria. Recibe el código del backend y, si
// llega, su nombre; así el color queda atado al código (estable) y el texto no.
// 'Publicada' usa el azul institucional (no verde): el verde queda reservado
// para los estados positivos.
const TONOS = {
  borrador: 'neutral',
  publicada: 'azul',
  en_proceso: 'aviso',
  cerrada: 'peligro',
}

export default function EtiquetaEstado({ codigo, nombre }) {
  return <Etiqueta tono={TONOS[codigo] ?? 'neutral'}>{nombre ?? codigo}</Etiqueta>
}
