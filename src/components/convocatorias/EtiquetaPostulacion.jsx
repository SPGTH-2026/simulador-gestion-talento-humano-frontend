import Etiqueta from '../ui/Etiqueta'
import { etiquetaEstadoPostulacion } from '../../lib/ventanaPostulacion'

// Badge del estado de una postulación propia. Los códigos del backend son
// 'borrador', 'postulada' y 'retirada'; el fallback cubre cualquier estado
// futuro. El texto sale del helper compartido (el borrador se ve como
// "Borrador, sin enviar"). 'Postulada' es un estado positivo: va en verde.
const TONOS = {
  borrador: 'aviso',
  postulada: 'exito',
  retirada: 'neutral',
}

export default function EtiquetaPostulacion({ codigo, nombre }) {
  return (
    <Etiqueta tono={TONOS[codigo] ?? 'neutral'}>
      {etiquetaEstadoPostulacion(codigo, nombre)}
    </Etiqueta>
  )
}
