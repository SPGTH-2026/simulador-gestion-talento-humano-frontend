import Icono from '../../ui/Icono'
import { CLASE_CAJA_SUAVE, CLASE_TEXTO_FUERTE } from '../../../lib/estilos'

// Sección de PanelRanking. Recibe el estado y las acciones del componente en la prop ctx.
export default function AvisosRanking({ ctx }) {
  const { aviso, avisos, hayAlerta } = ctx
  return (
  <section
    aria-label="Avisos del ranking"
    className={`px-3 py-2.5 ${hayAlerta ? 'rounded-xl border border-aviso/30 bg-aviso/10' : CLASE_CAJA_SUAVE}`}
  >
    <ul className="flex flex-col gap-1.5">
      {avisos.map((a) => (
        <li key={a.texto} className={`flex items-start gap-2 text-sm ${CLASE_TEXTO_FUERTE}`}>
          {a.tono === 'aviso' && <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0 text-aviso" />}
          {a.tono === 'exito' && <Icono nombre="check" className="mt-0.5 size-4 shrink-0 text-exito" />}
          {a.tono === 'info' && <span aria-hidden="true" className="mt-0.5 w-4 shrink-0 text-center">•</span>}
          <span className="min-w-0">{a.texto}</span>
        </li>
      ))}
    </ul>
  </section>
  )
}
