import { criterios } from './useComparadorCandidatos'
import Valor from './Valor'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { textoNota } from '../../lib/seleccion'

// Piezas de presentación del comparador: texto atenuado y celdas de puesto/resultado.
export const Suave = ({ children }) => <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{children}</span>

// Puesto y resultado con sus etiquetas, en una línea que puede partirse entre datos (no dentro de ellos).
export function PuestoYResultado({ posicion, resultado, sinPuesto, sinResultado }) {
  // Sin actividades (o si aún no está listo) no hay ni puesto ni resultado: se dice una sola vez, con palabras.
  if (posicion == null && resultado == null) return <Suave>Sin puesto ni resultado</Suave>
  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <span className="whitespace-nowrap">
        <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Puesto </span>
        <span className="font-semibold">
          <Valor valor={posicion} sinDato={sinPuesto} />
        </span>
      </span>
      <span className="whitespace-nowrap">
        <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Resultado </span>
        <span className="font-semibold">
          <Valor valor={resultado == null ? null : textoNota(resultado)} sinDato={sinResultado} />
        </span>
      </span>
    </span>
  )
}

// Los criterios, en un solo lugar: la tabla de escritorio y las tarjetas de móvil los leen de aquí, así que son SIEMPRE los
// mismos y van en el mismo orden. 'etiqueta' es el nombre del criterio; 'celda' pinta el dato de un candidato.

// Comparación de 2 a 5 candidatos de UNA convocatoria. SOLO LECTURA: no cambia la lista, las decisiones ni las marcas
// de «Elegir». Se pide en una sola petición al abrirse; con carga lenta muestra el estado y con error ofrece reintentar.
// 'ids' en el orden en que se marcaron. Escritorio: criterios en filas y candidatos en columnas; móvil: una tarjeta por
// candidato con los mismos criterios en el mismo orden.
