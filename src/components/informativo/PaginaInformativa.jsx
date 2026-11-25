import { CLASE_TARJETA, CLASE_TEXTO_SUAVE, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { CampoPendiente, EtiquetaContenido } from './Pendiente'

// Estructura común de las páginas informativas: título, aviso de borrador, índice de la página, secciones con su propia ancla y,
// al final, la lista de datos que faltan por completar tras la entrevista. Cada sección: { id, titulo, tipo?, children }.
export default function PaginaInformativa({ titulo, introduccion, secciones, pendientes = [] }) {
  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className={CLASE_TITULO_PAGINA}>{titulo}</h1>
        {introduccion && <p className={`mt-2 max-w-3xl text-base ${CLASE_TEXTO_SUAVE}`}>{introduccion}</p>}
      </header>

      <nav aria-label="En esta página" className={`${CLASE_TARJETA} p-4`}>
        <p className="text-sm font-semibold text-sena-azul dark:text-sena-texto">En esta página</p>
        <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {secciones.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex min-h-8 items-center text-sena-oscuro underline-offset-4 hover:underline dark:text-sena-acento"
              >
                {s.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {secciones.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-titulo`} className={`${CLASE_TARJETA} scroll-mt-4 p-4 sm:p-6`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2 id={`${s.id}-titulo`} className="text-lg font-semibold text-sena-azul dark:text-sena-texto">
              {s.titulo}
            </h2>
            {s.tipo && <EtiquetaContenido tipo={s.tipo} />}
          </div>
          <div className="mt-3 flex max-w-3xl flex-col gap-3 text-sm leading-relaxed text-slate-700 dark:text-sena-texto">
            {s.children}
          </div>
        </section>
      ))}

      {pendientes.length > 0 && (
        <section
          id="pendientes"
          aria-labelledby="pendientes-titulo"
          className="scroll-mt-4 rounded-2xl border border-dashed border-aviso/60 bg-aviso/10 p-4 sm:p-6"
        >
          <h2 id="pendientes-titulo" className="text-lg font-semibold text-aviso">
            Datos por completar ({pendientes.length})
          </h2>
          <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>
            Se completan tras la entrevista y la revisión con el instructor o asesor. Hasta entonces esta página es solo para revisión local.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {pendientes.map((p) => (
              <li key={p}>
                <CampoPendiente dato={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
