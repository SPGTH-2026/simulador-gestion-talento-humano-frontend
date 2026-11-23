import Rueda from '../../ui/Rueda'
import { CLASE_TEXTO_SUAVE } from '../../../lib/estilos'

// Estado de carga del ranking: se muestra mientras llega la primera página.
export default function CargandoRanking() {
  return (
    <p role="status" className={`flex items-center gap-2 py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>
      <Rueda /> Cargando ranking…
    </p>
  )
}
