import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import Icono from './Icono'

// Encabezado común de los diálogos de formulario: título (y una línea de contexto opcional) y la X de cerrar, de 44 px. La X
// se deshabilita mientras hay una petición en curso, igual que Escape y el fondo, que el diálogo ya ignora en ese caso.
export default function EncabezadoDialogo({ idTitulo, titulo, contexto, onCerrar, deshabilitado = false }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 pt-2">
        <h2 id={idTitulo} className="text-lg font-semibold text-slate-800 [overflow-wrap:anywhere] dark:text-sena-texto">
          {titulo}
        </h2>
        {contexto && <p className={`mt-0.5 text-sm [overflow-wrap:anywhere] ${CLASE_TEXTO_SUAVE}`}>{contexto}</p>}
      </div>
      <button
        type="button"
        onClick={onCerrar}
        disabled={deshabilitado}
        aria-label="Cerrar"
        className="-mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-sena-hundido hover:text-sena-azul focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sena disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none dark:text-sena-texto-suave dark:hover:bg-white/10 dark:hover:text-white"
      >
        <Icono nombre="cerrar" />
      </button>
    </div>
  )
}
