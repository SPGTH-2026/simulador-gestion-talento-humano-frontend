import Boton from '../../ui/Boton'
import { MensajeError } from '../../ui/Mensaje'

// Error al cargar el ranking cuando aún no hay datos. Recibe solo lo que muestra, por props.
export default function ErrorTotalRanking({ error, recargar }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <MensajeError>{error}</MensajeError>
      <Boton variante="contorno" tamano="tactil" onClick={recargar}>
        Reintentar
      </Boton>
    </div>
  )
}
