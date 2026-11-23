import Boton from '../../ui/Boton'
import { MensajeError } from '../../ui/Mensaje'

// Error al cargar el ranking cuando aún no hay datos. Recibe el estado del hook en la prop ctx.
export default function ErrorTotalRanking({ ctx }) {
  const { error, recargar } = ctx
  return (
    <div className="flex flex-col items-start gap-3">
      <MensajeError>{error}</MensajeError>
      <Boton variante="contorno" tamano="tactil" onClick={recargar}>
        Reintentar
      </Boton>
    </div>
  )
}
