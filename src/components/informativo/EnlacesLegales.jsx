import { Link } from 'react-router-dom'
import { PAGINA_ACERCA_DE, PAGINAS_LEGALES, RUTA_INFORMACION_LEGAL, paginasInformativasActivas } from '../../config/paginasInformativas'

// Accesos discretos a las páginas informativas. Solo se dibujan con la bandera de páginas informativas activa; sin ella no hay nada.
// «Acerca de SPGTH» es informativo y va aparte de los textos legales. Enlaces de texto pequeño, con 44 px de área en táctil.
const CLASE_ENLACE =
  'inline-flex min-h-11 items-center rounded px-1 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 sm:min-h-8'

/** Pie de las pantallas de acceso (inicio de sesión, registro, recuperación...): textos legales y, aparte, «Acerca de». */
export function PieLegal({ className = '' }) {
  if (!paginasInformativasActivas()) return null
  return (
    <nav aria-label="Información legal" className={`flex flex-wrap items-center justify-center gap-x-1 text-xs text-slate-600 dark:text-sena-texto-suave ${className}`.trim()}>
      {PAGINAS_LEGALES.map((p) => (
        <Link key={p.ruta} to={p.ruta} className={CLASE_ENLACE}>
          {p.titulo}
        </Link>
      ))}
      <span aria-hidden="true" className="mx-1 h-3 w-px bg-sena-linea dark:bg-sena-borde" />
      <Link to={PAGINA_ACERCA_DE.ruta} className={CLASE_ENLACE}>
        {PAGINA_ACERCA_DE.titulo}
      </Link>
    </nav>
  )
}

/** Área de usuario: «Información legal» (lleva a la lista de textos) y «Acerca de SPGTH» por separado, a la izquierda. No es un módulo del menú. */
export function EnlacesUsuario({ onNavegar, className = '' }) {
  if (!paginasInformativasActivas()) return null
  // A la izquierda, al pie del menú, en dos filas, con 44 px de área en cualquier pantalla (el pie de acceso conserva su medida compacta).
  const claseEnlace = CLASE_ENLACE.replace('sm:min-h-8', '')
  return (
    <nav aria-label="Información" className={`flex flex-col items-start text-xs text-slate-600 dark:text-sena-texto-suave ${className}`.trim()}>
      <Link to={RUTA_INFORMACION_LEGAL} onClick={onNavegar} className={claseEnlace}>
        Información legal
      </Link>
      <Link to={PAGINA_ACERCA_DE.ruta} onClick={onNavegar} className={claseEnlace}>
        {PAGINA_ACERCA_DE.titulo}
      </Link>
    </nav>
  )
}
