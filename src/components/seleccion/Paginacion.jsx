import Icono from '../ui/Icono'
import Boton from '../ui/Boton'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Paginación del servidor para las listas de Selección.
//  - Con una sola página no hay nada que paginar: solo se dice el total, en singular o plural
//    ("1 candidato", "2 convocatorias").
//  - Con varias, "Página x de y" y Anterior / Siguiente en una sola fila. Se usa aria-disabled y no
//    'disabled': al llegar a un extremo (o mientras llega la otra página) el botón con el foco no debe
//    perderlo. Los clics se ignoran mientras está inactivo, así no se piden páginas en ráfaga.
// El alto táctil es de 44 px y baja a 40 px donde hay puntero (lg), como en Convocatorias.
export default function Paginacion({ meta, singular, plural, etiqueta, ocupado = false, onPagina, className = '' }) {
  const total = meta.total ?? 0
  const ultima = Math.max(meta.last_page ?? 1, 1)
  const nombre = total === 1 ? singular : plural

  if (ultima <= 1) {
    return (
      <p className={`text-sm ${CLASE_TEXTO_SUAVE} ${className}`.trim()} aria-live="polite">
        <span className="tabular-nums">{total}</span> {nombre}
      </p>
    )
  }

  const enPrimera = meta.current_page <= 1
  const enUltima = meta.current_page >= ultima
  const ir = (n, inactivo) => () => {
    if (!inactivo) onPagina(n)
  }

  return (
    // El contenedor decide la forma: en una columna estrecha (la lista de convocatorias) el texto va arriba y
    // los botones debajo, a todo el ancho; en un ancho amplio (debajo de la tabla) van en una sola fila.
    <div className={`@container ${className}`.trim()}>
      <nav
        aria-label={etiqueta}
        className="flex flex-col gap-2 text-sm @min-[480px]:flex-row @min-[480px]:items-center @min-[480px]:justify-between"
      >
        <p className={CLASE_TEXTO_SUAVE} aria-live="polite">
          Página <span className="tabular-nums">{meta.current_page}</span> de <span className="tabular-nums">{ultima}</span>
          {' · '}
          <span className="tabular-nums">{total}</span> {nombre}
        </p>
        <div className="grid grid-cols-2 gap-2 @min-[480px]:flex">
          <Boton
            variante="contorno"
            tamano="flexible"
            className="@min-[480px]:min-w-28 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 lg:min-h-10"
            aria-label="Página anterior"
            aria-disabled={ocupado || enPrimera}
            onClick={ir(meta.current_page - 1, ocupado || enPrimera)}
          >
            <Icono nombre="flechaIzquierda" className="size-4" />
            Anterior
          </Boton>
          <Boton
            variante="contorno"
            tamano="flexible"
            className="@min-[480px]:min-w-28 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 lg:min-h-10"
            aria-label="Página siguiente"
            aria-disabled={ocupado || enUltima}
            onClick={ir(meta.current_page + 1, ocupado || enUltima)}
          >
            Siguiente
            <Icono nombre="flechaDerecha" className="size-4" />
          </Boton>
        </div>
      </nav>
    </div>
  )
}
