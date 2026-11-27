import { Link } from 'react-router-dom'
import { CLASE_SUBTITULO_PAGINA, CLASE_TARJETA, CLASE_TEXTO_SUAVE, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { PAGINA_ACERCA_DE, PAGINAS_LEGALES } from '../../config/paginasInformativas'

// Punto de entrada de «Información legal» (desde el área de usuario): las cuatro páginas informativas en una sola cuadrícula.
function Tarjeta({ ruta, titulo, resumen }) {
  return (
    <li>
      <Link
        to={ruta}
        className={`${CLASE_TARJETA} flex h-full min-h-11 flex-col gap-1 p-4 transition-colors hover:bg-sena-hundido/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 dark:hover:bg-white/5`}
      >
        <span className="text-base font-semibold text-sena-azul dark:text-sena-texto">{titulo}</span>
        <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{resumen}</span>
      </Link>
    </li>
  )
}

export default function InformacionLegal() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className={CLASE_TITULO_PAGINA}>Información legal</h1>
        <p className={`${CLASE_SUBTITULO_PAGINA} text-base`}>Los textos que explican cómo funciona SPGTH y cómo se tratan tus datos.</p>
      </header>
      {/* Las cuatro páginas juntas: los tres textos legales y «Acerca de SPGTH». */}
      <ul aria-label="Información" className="grid gap-3 sm:auto-rows-fr sm:grid-cols-2">
        {[...PAGINAS_LEGALES, PAGINA_ACERCA_DE].map((p) => (
          <Tarjeta key={p.ruta} ruta={p.ruta} titulo={p.titulo} resumen={p.resumen} />
        ))}
      </ul>
    </div>
  )
}
