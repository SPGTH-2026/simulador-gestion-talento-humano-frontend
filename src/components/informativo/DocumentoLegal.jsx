import { CLASE_SUBTITULO_PAGINA, CLASE_TARJETA, CLASE_TEXTO_SUAVE, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import BotonVolverArriba from './BotonVolverArriba'
import IndiceDocumento from './IndiceDocumento'

// Composición de lectura de los textos legales y de las páginas informativas, con el lenguaje de las pantallas de la aplicación: título y
// descripción breve como en cualquier página, un panel lateral con el índice y UNA sola superficie de lectura (borde y fondo del sistema)
// donde las secciones se separan con una línea, sin una tarjeta por párrafo. Tiene su altura natural y se desplaza con la página (sin
// altura máxima ni desplazamiento propio); el botón «Volver arriba» vive dentro de ella y se detiene al final, sobre el pie. 'meta' (opcional) solo se muestra si hay datos definidos:
// [['Versión', '1.0'], ['Vigente desde', '01/12/2026']]. Cada sección: { id, titulo, children }.
const CLASE_TEXTO =
  'text-base leading-7 text-slate-700 dark:text-sena-texto text-pretty [&_p+p]:mt-3 [&_ul+p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:marker:text-slate-400 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_a]:rounded [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-sena/60'

export default function DocumentoLegal({ titulo, introduccion, meta = [], secciones }) {
  return (
    <article className="flex flex-col gap-5">
      <header>
        <h1 className={`${CLASE_TITULO_PAGINA} text-balance`}>{titulo}</h1>
        {introduccion && <p className={`${CLASE_SUBTITULO_PAGINA} max-w-[68ch] text-base`}>{introduccion}</p>}
        {meta.length > 0 && (
          <p className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm ${CLASE_TEXTO_SUAVE}`}>
            {meta.map(([etiqueta, valor]) => (
              <span key={etiqueta}>
                {etiqueta}: <span className="font-medium text-slate-800 dark:text-sena-texto">{valor}</span>
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-6">
          {/* La celda del índice ocupa todo el alto del documento: así el índice, que es sticky, acompaña la lectura y se detiene al final. */}
        <div className="lg:self-stretch">
          <IndiceDocumento secciones={secciones} />
        </div>

        <div className={`${CLASE_TARJETA} px-5 py-2 sm:px-8 sm:py-4`}>
          {secciones.map((s) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-titulo`}
              className="scroll-mt-24 border-t border-sena-linea py-6 first:border-t-0 dark:border-sena-borde/60"
            >
              <h2 id={`${s.id}-titulo`} className="mb-3 text-xl font-semibold leading-snug text-sena-azul text-balance dark:text-sena-texto">
                {s.titulo}
              </h2>
              <div className={CLASE_TEXTO}>{s.children}</div>
            </section>
          ))}
          <BotonVolverArriba />
        </div>
      </div>
    </article>
  )
}
