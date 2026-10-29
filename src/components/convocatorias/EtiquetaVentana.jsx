import Etiqueta from '../ui/Etiqueta'
import { estadoVentana } from '../../lib/ventanaPostulacion'

// Estado DERIVADO de una convocatoria para el postulante: si la ventana de
// postulación está ABIERTA, si aún no abre (PRÓXIMA) o si ya CERRÓ.
//
// La REGLA no es nueva: es la del backend (Convocatoria::ventanaPostulacion) y la
// replica estadoVentana() de lib/ventanaPostulacion.js, que ya usa el panel de
// postulación y el detalle. Aquí solo se le pone el texto y el color.
//
// Tonos: verde (abierta), ámbar (próxima) y neutro (cerrada o no publicada).
const TONOS = {
  abierta: 'exito',
  antes: 'aviso',
  cerrada: 'neutral',
  no_publicada: 'neutral',
}

const ETIQUETAS = {
  abierta: 'Abierta',
  antes: 'Próxima',
  cerrada: 'Cerrada',
  no_publicada: 'No publicada',
}

export default function EtiquetaVentana({ convocatoria }) {
  const ventana = estadoVentana(convocatoria)

  return (
    <Etiqueta tono={TONOS[ventana] ?? 'neutral'}>
      {ETIQUETAS[ventana] ?? '—'}
    </Etiqueta>
  )
}
