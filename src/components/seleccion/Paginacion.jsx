import { IconoFlechaDerecha, IconoFlechaIzquierda } from '../convocatorias/Iconos'
import Boton from '../ui/Boton'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Paginación del servidor: Anterior / Siguiente y "Página x de y". Mientras llega
// otra página ('ocupado') los dos botones se bloquean, para no pedir páginas en
// ráfaga ni saltar dos veces con un doble clic.
export default function Paginacion({ meta, unidad, etiqueta, ocupado = false, onPagina }) {
  const ultima = Math.max(meta.last_page ?? 1, 1)

  return (
    <nav
      aria-label={etiqueta}
      className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className={CLASE_TEXTO_SUAVE}>
        Página <span className="tabular-nums">{meta.current_page}</span> de{' '}
        <span className="tabular-nums">{ultima}</span> ·{' '}
        <span className="tabular-nums">{meta.total}</span> {unidad}
      </p>
      <div className="flex flex-wrap gap-2">
        <Boton
          variante="contorno"
          tamano="tactil"
          className="min-w-32 flex-1 sm:flex-none"
          onClick={() => onPagina(meta.current_page - 1)}
          disabled={ocupado || meta.current_page <= 1}
        >
          <IconoFlechaIzquierda className="h-4 w-4" />
          Anterior
        </Boton>
        <Boton
          variante="contorno"
          tamano="tactil"
          className="min-w-32 flex-1 sm:flex-none"
          onClick={() => onPagina(meta.current_page + 1)}
          disabled={ocupado || meta.current_page >= ultima}
        >
          Siguiente
          <IconoFlechaDerecha className="h-4 w-4" />
        </Boton>
      </div>
    </nav>
  )
}
