import { CLASE_CAMPO } from '../../lib/estilos'
import Icono from './Icono'

// Caja de búsqueda del sistema: el control de texto con la lupa a la izquierda. Todas las búsquedas
// (convocatorias, evaluación, usuarios, portafolios) deben usarla para verse y comportarse igual.
// Va dentro de un <Campo> (que pone la etiqueta visible); el resto de atributos pasan al <input>.
export default function CampoBusqueda({ className = '', ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500 dark:text-sena-texto-suave">
        <Icono nombre="lupa" />
      </span>
      <input type="search" {...props} className={`${CLASE_CAMPO} pl-10 ${className}`.trim()} />
    </div>
  )
}
