import Icono from '../ui/Icono'
import { CLASE_TARJETA } from '../../lib/estilos'

// Índice del documento en un panel delimitado con el borde y el fondo del sistema. En escritorio es una columna a la izquierda que acompaña la lectura (sticky bajo la cabecera, limitada por su contenedor); en
// móvil se pliega en un desplegable de 44 px para que el texto empiece pronto. Los enlaces saltan a las secciones (cada una tiene su ancla).
const CLASE_ENLACE =
  'flex min-h-11 items-center rounded-lg px-3 text-sm text-slate-600 transition-colors hover:bg-sena-fondo hover:text-sena-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 motion-reduce:transition-none dark:text-sena-texto-suave dark:hover:bg-white/5 dark:hover:text-white lg:min-h-8'

function Enlaces({ secciones }) {
  return (
    <ol className="flex flex-col">
      {secciones.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className={CLASE_ENLACE}>
            {s.titulo}
          </a>
        </li>
      ))}
    </ol>
  )
}

export default function IndiceDocumento({ secciones }) {
  return (
    <>
      <details className={`${CLASE_TARJETA} group lg:hidden`}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 text-sm font-semibold text-sena-azul focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 dark:text-sena-texto [&::-webkit-details-marker]:hidden">
          En esta página
          <Icono nombre="chevron" className="size-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
        </summary>
        <nav aria-label="Índice de la página" className="border-t border-sena-linea p-2 dark:border-sena-borde/60">
          <Enlaces secciones={secciones} />
        </nav>
      </details>
      <nav aria-label="En esta página" className={`${CLASE_TARJETA} sticky top-20 hidden p-3 lg:block lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto`}>
        <p className="px-3 pb-1 pt-1 text-sm font-semibold text-sena-azul dark:text-sena-texto">En esta página</p>
        <Enlaces secciones={secciones} />
      </nav>
    </>
  )
}
