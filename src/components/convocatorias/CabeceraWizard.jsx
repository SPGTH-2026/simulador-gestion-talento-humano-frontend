import Boton from '../ui/Boton'
import EtiquetaEstado from './EtiquetaEstado'
import Icono from '../ui/Icono'
import { CLASE_SUBTITULO_PAGINA, CLASE_TITULO_PAGINA } from '../../lib/estilos'

// Encabezado del asistente: volver al listado, título, estado (si la convocatoria ya existe) y subtítulo del paso.
export default function CabeceraWizard({ titulo, estado, subtitulo, onVolver }) {
  return (
    <header className="flex flex-col">
      <Boton variante="fantasma" tamano="tactil" onClick={onVolver} className="-ml-4 self-start">
        <Icono nombre="flechaIzquierda" className="size-4" />
        Volver al listado
      </Boton>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className={CLASE_TITULO_PAGINA}>{titulo}</h1>
        {estado && <EtiquetaEstado codigo={estado.codigo} nombre={estado.nombre} />}
      </div>
      <p className={CLASE_SUBTITULO_PAGINA}>{subtitulo}</p>
    </header>
  )
}
