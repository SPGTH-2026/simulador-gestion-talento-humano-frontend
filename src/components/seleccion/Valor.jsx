import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// «—» dicho con palabras para el lector de pantalla: un dato que no existe no es un cero. Lo comparten la evidencia por
// finalista de Decidir y el comparador de candidatos.
export default function Valor({ valor, sinDato }) {
  if (valor == null) {
    return (
      <span className={CLASE_TEXTO_SUAVE}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{sinDato}</span>
      </span>
    )
  }
  return <span className={`tabular-nums ${CLASE_TEXTO_FUERTE}`}>{valor}</span>
}
