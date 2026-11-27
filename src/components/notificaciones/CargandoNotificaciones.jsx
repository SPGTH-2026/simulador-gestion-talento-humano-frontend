import Rueda from '../ui/Rueda'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Carga de la lista: la rueda y el texto, anunciados una sola vez a los lectores de pantalla. Sustituye a los esqueletos (que simulaban
// filas que quizá no existen); no se dibuja ningún «vacío» hasta saber qué hay.
export default function CargandoNotificaciones() {
  return (
    <p role="status" className={`flex items-center justify-center gap-2 py-6 text-sm ${CLASE_TEXTO_SUAVE}`}>
      <Rueda /> Cargando notificaciones…
    </p>
  )
}
